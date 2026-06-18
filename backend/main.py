from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session, relationship
from pydantic import BaseModel, EmailStr
from typing import List, Optional
from datetime import datetime
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:postgres@db:5432/inventory")

engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI(title="Inventory & Order Management API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Models ──────────────────────────────────────────────────────────────────

class Product(Base):
    __tablename__ = "products"
    id       = Column(Integer, primary_key=True, index=True)
    name     = Column(String, nullable=False)
    sku      = Column(String, unique=True, nullable=False)
    price    = Column(Float, nullable=False)
    quantity = Column(Integer, nullable=False, default=0)

class Customer(Base):
    __tablename__ = "customers"
    id    = Column(Integer, primary_key=True, index=True)
    name  = Column(String, nullable=False)
    email = Column(String, unique=True, nullable=False)
    phone = Column(String, nullable=False)

class Order(Base):
    __tablename__ = "orders"
    id          = Column(Integer, primary_key=True, index=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    total       = Column(Float, nullable=False, default=0)
    created_at  = Column(DateTime, default=datetime.utcnow)
    items       = relationship("OrderItem", back_populates="order", cascade="all, delete")
    customer    = relationship("Customer")

class OrderItem(Base):
    __tablename__ = "order_items"
    id         = Column(Integer, primary_key=True, index=True)
    order_id   = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity   = Column(Integer, nullable=False)
    unit_price = Column(Float, nullable=False)
    order      = relationship("Order", back_populates="items")
    product    = relationship("Product")

Base.metadata.create_all(bind=engine)

# ── Schemas ─────────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str
    sku: str
    price: float
    quantity: int

class ProductOut(ProductCreate):
    id: int
    class Config: from_attributes = True

class CustomerCreate(BaseModel):
    name: str
    email: str
    phone: str

class CustomerOut(CustomerCreate):
    id: int
    class Config: from_attributes = True

class OrderItemIn(BaseModel):
    product_id: int
    quantity: int

class OrderCreate(BaseModel):
    customer_id: int
    items: List[OrderItemIn]

class OrderItemOut(BaseModel):
    product_id: int
    quantity: int
    unit_price: float
    class Config: from_attributes = True

class OrderOut(BaseModel):
    id: int
    customer_id: int
    total: float
    created_at: datetime
    items: List[OrderItemOut]
    class Config: from_attributes = True

# ── DB Dep ───────────────────────────────────────────────────────────────────

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ── Products ─────────────────────────────────────────────────────────────────

@app.post("/products", response_model=ProductOut, status_code=201)
def create_product(p: ProductCreate, db: Session = Depends(get_db)):
    if db.query(Product).filter(Product.sku == p.sku).first():
        raise HTTPException(400, "SKU already exists")
    if p.quantity < 0:
        raise HTTPException(400, "Quantity cannot be negative")
    product = Product(**p.dict())
    db.add(product); db.commit(); db.refresh(product)
    return product

@app.get("/products", response_model=List[ProductOut])
def list_products(db: Session = Depends(get_db)):
    return db.query(Product).all()

@app.get("/products/{id}", response_model=ProductOut)
def get_product(id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == id).first()
    if not p: raise HTTPException(404, "Product not found")
    return p

@app.put("/products/{id}", response_model=ProductOut)
def update_product(id: int, p: ProductCreate, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == id).first()
    if not product: raise HTTPException(404, "Product not found")
    if p.quantity < 0: raise HTTPException(400, "Quantity cannot be negative")
    existing = db.query(Product).filter(Product.sku == p.sku, Product.id != id).first()
    if existing: raise HTTPException(400, "SKU already exists")
    for k, v in p.dict().items():
        setattr(product, k, v)
    db.commit(); db.refresh(product)
    return product

@app.delete("/products/{id}", status_code=204)
def delete_product(id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == id).first()
    if not p: raise HTTPException(404, "Product not found")
    db.delete(p); db.commit()

# ── Customers ────────────────────────────────────────────────────────────────

@app.post("/customers", response_model=CustomerOut, status_code=201)
def create_customer(c: CustomerCreate, db: Session = Depends(get_db)):
    if db.query(Customer).filter(Customer.email == c.email).first():
        raise HTTPException(400, "Email already exists")
    customer = Customer(**c.dict())
    db.add(customer); db.commit(); db.refresh(customer)
    return customer

@app.get("/customers", response_model=List[CustomerOut])
def list_customers(db: Session = Depends(get_db)):
    return db.query(Customer).all()

@app.get("/customers/{id}", response_model=CustomerOut)
def get_customer(id: int, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.id == id).first()
    if not c: raise HTTPException(404, "Customer not found")
    return c

@app.delete("/customers/{id}", status_code=204)
def delete_customer(id: int, db: Session = Depends(get_db)):
    c = db.query(Customer).filter(Customer.id == id).first()
    if not c: raise HTTPException(404, "Customer not found")
    db.delete(c); db.commit()

# ── Orders ───────────────────────────────────────────────────────────────────

@app.post("/orders", response_model=OrderOut, status_code=201)
def create_order(o: OrderCreate, db: Session = Depends(get_db)):
    if not db.query(Customer).filter(Customer.id == o.customer_id).first():
        raise HTTPException(404, "Customer not found")
    total = 0.0
    order = Order(customer_id=o.customer_id, total=0)
    db.add(order); db.flush()
    for item in o.items:
        product = db.query(Product).filter(Product.id == item.product_id).first()
        if not product: raise HTTPException(404, f"Product {item.product_id} not found")
        if product.quantity < item.quantity:
            raise HTTPException(400, f"Insufficient stock for {product.name}")
        product.quantity -= item.quantity
        total += product.price * item.quantity
        db.add(OrderItem(order_id=order.id, product_id=item.product_id,
                         quantity=item.quantity, unit_price=product.price))
    order.total = total
    db.commit(); db.refresh(order)
    return order

@app.get("/orders", response_model=List[OrderOut])
def list_orders(db: Session = Depends(get_db)):
    return db.query(Order).all()

@app.get("/orders/{id}", response_model=OrderOut)
def get_order(id: int, db: Session = Depends(get_db)):
    o = db.query(Order).filter(Order.id == id).first()
    if not o: raise HTTPException(404, "Order not found")
    return o

@app.delete("/orders/{id}", status_code=204)
def delete_order(id: int, db: Session = Depends(get_db)):
    o = db.query(Order).filter(Order.id == id).first()
    if not o: raise HTTPException(404, "Order not found")
    db.delete(o); db.commit()

# ── Dashboard ────────────────────────────────────────────────────────────────

@app.get("/dashboard")
def dashboard(db: Session = Depends(get_db)):
    low_stock = db.query(Product).filter(Product.quantity < 5).all()
    return {
        "total_products":  db.query(Product).count(),
        "total_customers": db.query(Customer).count(),
        "total_orders":    db.query(Order).count(),
        "low_stock":       [{"id": p.id, "name": p.name, "quantity": p.quantity} for p in low_stock],
    }
