from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict
import uuid
from datetime import datetime
from bson import ObjectId

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ.get('DB_NAME', 'hardware_store')]

# Create the main app
app = FastAPI(title="Belgian Hardware Store API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ==================== MODELS ====================

# Helper for ObjectId
def str_id():
    return str(uuid.uuid4())

# Multilingual Text Model
class MultilingualText(BaseModel):
    nl: str = ""  # Nederlands (Flemish)
    fr: str = ""  # French
    en: str = ""  # English
    tr: str = ""  # Turkish

# Category Models
class CategoryBase(BaseModel):
    name: MultilingualText
    description: MultilingualText = MultilingualText()
    image: Optional[str] = None  # base64 image
    parent_id: Optional[str] = None
    is_active: bool = True
    sort_order: int = 0

class CategoryCreate(CategoryBase):
    pass

class Category(CategoryBase):
    id: str = Field(default_factory=str_id)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Product Models
class ProductBase(BaseModel):
    name: MultilingualText
    description: MultilingualText = MultilingualText()
    price: float
    stock: int = 0
    sku: str = ""
    category_id: str
    images: List[str] = []  # base64 images
    is_active: bool = True
    unit: str = "piece"  # piece, kg, meter, etc.
    brand: str = ""
    specifications: Dict[str, str] = {}

class ProductCreate(ProductBase):
    pass

class ProductUpdate(BaseModel):
    name: Optional[MultilingualText] = None
    description: Optional[MultilingualText] = None
    price: Optional[float] = None
    stock: Optional[int] = None
    sku: Optional[str] = None
    category_id: Optional[str] = None
    images: Optional[List[str]] = None
    is_active: Optional[bool] = None
    unit: Optional[str] = None
    brand: Optional[str] = None
    specifications: Optional[Dict[str, str]] = None

class Product(ProductBase):
    id: str = Field(default_factory=str_id)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Cart Item
class CartItem(BaseModel):
    product_id: str
    quantity: int = 1

# Order Models
class OrderItem(BaseModel):
    product_id: str
    product_name: MultilingualText
    quantity: int
    price: float
    total: float

class CustomerInfo(BaseModel):
    name: str
    email: str
    phone: str
    address: str
    city: str
    postal_code: str
    country: str = "Belgium"

class OrderCreate(BaseModel):
    items: List[CartItem]
    customer: CustomerInfo
    payment_method: str = "mock"  # mock, bancontact, ideal, paypal, card
    notes: str = ""

class Order(BaseModel):
    id: str = Field(default_factory=str_id)
    order_number: str = ""
    items: List[OrderItem] = []
    customer: CustomerInfo
    subtotal: float = 0
    tax: float = 0
    total: float = 0
    status: str = "pending"  # pending, confirmed, processing, shipped, delivered, cancelled
    payment_status: str = "pending"  # pending, paid, failed, refunded
    payment_method: str = "mock"
    notes: str = ""
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

# Customer Model (for admin)
class Customer(BaseModel):
    id: str = Field(default_factory=str_id)
    name: str
    email: str
    phone: str = ""
    address: str = ""
    city: str = ""
    postal_code: str = ""
    country: str = "Belgium"
    total_orders: int = 0
    total_spent: float = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Discount Model
class DiscountBase(BaseModel):
    code: str
    name: MultilingualText
    description: MultilingualText = MultilingualText()
    discount_type: str = "percentage"  # percentage, fixed
    discount_value: float
    min_order_amount: float = 0
    max_uses: int = 0  # 0 = unlimited
    used_count: int = 0
    is_active: bool = True
    valid_from: datetime = Field(default_factory=datetime.utcnow)
    valid_until: Optional[datetime] = None

class DiscountCreate(DiscountBase):
    pass

class Discount(DiscountBase):
    id: str = Field(default_factory=str_id)
    created_at: datetime = Field(default_factory=datetime.utcnow)

# Dashboard Stats
class DashboardStats(BaseModel):
    total_products: int = 0
    total_orders: int = 0
    total_revenue: float = 0
    total_customers: int = 0
    pending_orders: int = 0
    low_stock_products: int = 0
    recent_orders: List[dict] = []
    top_products: List[dict] = []

# ==================== CATEGORY ENDPOINTS ====================

@api_router.get("/categories", response_model=List[Category])
async def get_categories(active_only: bool = False):
    query = {"is_active": True} if active_only else {}
    categories = await db.categories.find(query).sort("sort_order", 1).to_list(100)
    return [Category(**{**cat, "id": cat.get("id")}) for cat in categories]

@api_router.get("/categories/{category_id}", response_model=Category)
async def get_category(category_id: str):
    category = await db.categories.find_one({"id": category_id})
    if not category:
        raise HTTPException(status_code=404, detail="Category not found")
    return Category(**{**category, "id": category.get("id")})

@api_router.post("/categories", response_model=Category)
async def create_category(category: CategoryCreate):
    category_dict = category.dict()
    category_obj = Category(**category_dict)
    await db.categories.insert_one(category_obj.dict())
    return category_obj

@api_router.put("/categories/{category_id}", response_model=Category)
async def update_category(category_id: str, category: CategoryCreate):
    existing = await db.categories.find_one({"id": category_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Category not found")
    
    update_data = category.dict()
    update_data["updated_at"] = datetime.utcnow()
    await db.categories.update_one({"id": category_id}, {"$set": update_data})
    
    updated = await db.categories.find_one({"id": category_id})
    return Category(**updated)

@api_router.delete("/categories/{category_id}")
async def delete_category(category_id: str):
    result = await db.categories.delete_one({"id": category_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Category not found")
    return {"message": "Category deleted successfully"}

# ==================== PRODUCT ENDPOINTS ====================

@api_router.get("/products", response_model=List[Product])
async def get_products(
    category_id: Optional[str] = None,
    search: Optional[str] = None,
    active_only: bool = False,
    skip: int = 0,
    limit: int = 50
):
    query = {}
    if category_id:
        query["category_id"] = category_id
    if active_only:
        query["is_active"] = True
    if search:
        query["$or"] = [
            {"name.nl": {"$regex": search, "$options": "i"}},
            {"name.fr": {"$regex": search, "$options": "i"}},
            {"name.en": {"$regex": search, "$options": "i"}},
            {"name.tr": {"$regex": search, "$options": "i"}},
            {"sku": {"$regex": search, "$options": "i"}},
            {"brand": {"$regex": search, "$options": "i"}}
        ]
    
    products = await db.products.find(query).skip(skip).limit(limit).to_list(limit)
    return [Product(**{**prod, "id": prod.get("id")}) for prod in products]

@api_router.get("/products/{product_id}", response_model=Product)
async def get_product(product_id: str):
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return Product(**product)

@api_router.post("/products", response_model=Product)
async def create_product(product: ProductCreate):
    product_dict = product.dict()
    product_obj = Product(**product_dict)
    await db.products.insert_one(product_obj.dict())
    return product_obj

@api_router.put("/products/{product_id}", response_model=Product)
async def update_product(product_id: str, product: ProductUpdate):
    existing = await db.products.find_one({"id": product_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Product not found")
    
    update_data = {k: v for k, v in product.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    await db.products.update_one({"id": product_id}, {"$set": update_data})
    
    updated = await db.products.find_one({"id": product_id})
    return Product(**updated)

@api_router.patch("/products/{product_id}/stock")
async def update_stock(product_id: str, quantity: int):
    """Update product stock (positive to add, negative to subtract)"""
    product = await db.products.find_one({"id": product_id})
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    new_stock = product.get("stock", 0) + quantity
    if new_stock < 0:
        raise HTTPException(status_code=400, detail="Insufficient stock")
    
    await db.products.update_one(
        {"id": product_id},
        {"$set": {"stock": new_stock, "updated_at": datetime.utcnow()}}
    )
    return {"message": "Stock updated", "new_stock": new_stock}

@api_router.delete("/products/{product_id}")
async def delete_product(product_id: str):
    result = await db.products.delete_one({"id": product_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Product not found")
    return {"message": "Product deleted successfully"}

# ==================== ORDER ENDPOINTS ====================

def generate_order_number():
    return f"ORD-{datetime.utcnow().strftime('%Y%m%d')}-{str(uuid.uuid4())[:8].upper()}"

@api_router.post("/orders", response_model=Order)
async def create_order(order_data: OrderCreate):
    # Validate products and calculate totals
    order_items = []
    subtotal = 0
    
    for item in order_data.items:
        product = await db.products.find_one({"id": item.product_id})
        if not product:
            raise HTTPException(status_code=404, detail=f"Product {item.product_id} not found")
        if product.get("stock", 0) < item.quantity:
            raise HTTPException(status_code=400, detail=f"Insufficient stock for {product.get('name', {}).get('en', 'product')}")
        
        item_total = product["price"] * item.quantity
        order_items.append(OrderItem(
            product_id=item.product_id,
            product_name=MultilingualText(**product.get("name", {})),
            quantity=item.quantity,
            price=product["price"],
            total=item_total
        ))
        subtotal += item_total
    
    # Calculate tax (21% VAT in Belgium)
    tax = subtotal * 0.21
    total = subtotal + tax
    
    # Create order
    order = Order(
        order_number=generate_order_number(),
        items=order_items,
        customer=order_data.customer,
        subtotal=round(subtotal, 2),
        tax=round(tax, 2),
        total=round(total, 2),
        payment_method=order_data.payment_method,
        notes=order_data.notes,
        status="pending",
        payment_status="pending"
    )
    
    await db.orders.insert_one(order.dict())
    
    # Update stock for each product
    for item in order_data.items:
        await db.products.update_one(
            {"id": item.product_id},
            {"$inc": {"stock": -item.quantity}, "$set": {"updated_at": datetime.utcnow()}}
        )
    
    # Update or create customer record
    existing_customer = await db.customers.find_one({"email": order_data.customer.email})
    if existing_customer:
        await db.customers.update_one(
            {"email": order_data.customer.email},
            {
                "$inc": {"total_orders": 1, "total_spent": total},
                "$set": {
                    "name": order_data.customer.name,
                    "phone": order_data.customer.phone,
                    "address": order_data.customer.address,
                    "city": order_data.customer.city,
                    "postal_code": order_data.customer.postal_code
                }
            }
        )
    else:
        customer = Customer(
            name=order_data.customer.name,
            email=order_data.customer.email,
            phone=order_data.customer.phone,
            address=order_data.customer.address,
            city=order_data.customer.city,
            postal_code=order_data.customer.postal_code,
            total_orders=1,
            total_spent=total
        )
        await db.customers.insert_one(customer.dict())
    
    return order

@api_router.get("/orders", response_model=List[Order])
async def get_orders(
    status: Optional[str] = None,
    skip: int = 0,
    limit: int = 50
):
    query = {}
    if status:
        query["status"] = status
    
    orders = await db.orders.find(query).sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [Order(**order) for order in orders]

@api_router.get("/orders/{order_id}", response_model=Order)
async def get_order(order_id: str):
    order = await db.orders.find_one({"id": order_id})
    if not order:
        # Try by order_number
        order = await db.orders.find_one({"order_number": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**order)

@api_router.patch("/orders/{order_id}/status")
async def update_order_status(order_id: str, status: str):
    valid_statuses = ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"]
    if status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")
    
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    # If cancelling, restore stock
    if status == "cancelled" and order.get("status") != "cancelled":
        for item in order.get("items", []):
            await db.products.update_one(
                {"id": item["product_id"]},
                {"$inc": {"stock": item["quantity"]}}
            )
    
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}}
    )
    return {"message": f"Order status updated to {status}"}

@api_router.patch("/orders/{order_id}/payment")
async def update_payment_status(order_id: str, payment_status: str):
    valid_statuses = ["pending", "paid", "failed", "refunded"]
    if payment_status not in valid_statuses:
        raise HTTPException(status_code=400, detail=f"Invalid payment status. Must be one of: {valid_statuses}")
    
    result = await db.orders.update_one(
        {"id": order_id},
        {"$set": {"payment_status": payment_status, "updated_at": datetime.utcnow()}}
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Order not found")
    return {"message": f"Payment status updated to {payment_status}"}

# ==================== DISCOUNT ENDPOINTS ====================

@api_router.get("/discounts", response_model=List[Discount])
async def get_discounts(active_only: bool = False):
    query = {"is_active": True} if active_only else {}
    discounts = await db.discounts.find(query).to_list(100)
    return [Discount(**discount) for discount in discounts]

@api_router.post("/discounts", response_model=Discount)
async def create_discount(discount: DiscountCreate):
    # Check if code already exists
    existing = await db.discounts.find_one({"code": discount.code.upper()})
    if existing:
        raise HTTPException(status_code=400, detail="Discount code already exists")
    
    discount_dict = discount.dict()
    discount_dict["code"] = discount_dict["code"].upper()
    discount_obj = Discount(**discount_dict)
    await db.discounts.insert_one(discount_obj.dict())
    return discount_obj

@api_router.get("/discounts/validate/{code}")
async def validate_discount(code: str, order_amount: float = 0):
    discount = await db.discounts.find_one({"code": code.upper(), "is_active": True})
    if not discount:
        raise HTTPException(status_code=404, detail="Invalid discount code")
    
    now = datetime.utcnow()
    if discount.get("valid_until") and discount["valid_until"] < now:
        raise HTTPException(status_code=400, detail="Discount code has expired")
    
    if discount.get("max_uses", 0) > 0 and discount.get("used_count", 0) >= discount["max_uses"]:
        raise HTTPException(status_code=400, detail="Discount code has reached maximum uses")
    
    if order_amount < discount.get("min_order_amount", 0):
        raise HTTPException(status_code=400, detail=f"Minimum order amount is €{discount['min_order_amount']}")
    
    return Discount(**discount)

@api_router.delete("/discounts/{discount_id}")
async def delete_discount(discount_id: str):
    result = await db.discounts.delete_one({"id": discount_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Discount not found")
    return {"message": "Discount deleted successfully"}

# ==================== CUSTOMER ENDPOINTS (ADMIN) ====================

@api_router.get("/customers", response_model=List[Customer])
async def get_customers(skip: int = 0, limit: int = 50):
    customers = await db.customers.find().sort("created_at", -1).skip(skip).limit(limit).to_list(limit)
    return [Customer(**customer) for customer in customers]

@api_router.get("/customers/{customer_id}", response_model=Customer)
async def get_customer(customer_id: str):
    customer = await db.customers.find_one({"id": customer_id})
    if not customer:
        customer = await db.customers.find_one({"email": customer_id})
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return Customer(**customer)

# ==================== ADMIN DASHBOARD ====================

@api_router.get("/admin/dashboard", response_model=DashboardStats)
async def get_dashboard_stats():
    # Total counts
    total_products = await db.products.count_documents({})
    total_orders = await db.orders.count_documents({})
    total_customers = await db.customers.count_documents({})
    pending_orders = await db.orders.count_documents({"status": "pending"})
    low_stock_products = await db.products.count_documents({"stock": {"$lt": 10}})
    
    # Total revenue
    pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$total"}}}
    ]
    revenue_result = await db.orders.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    # Recent orders
    recent_orders = await db.orders.find().sort("created_at", -1).limit(5).to_list(5)
    
    # Top products by order count
    top_pipeline = [
        {"$unwind": "$items"},
        {"$group": {"_id": "$items.product_id", "count": {"$sum": "$items.quantity"}}},
        {"$sort": {"count": -1}},
        {"$limit": 5}
    ]
    top_products_result = await db.orders.aggregate(top_pipeline).to_list(5)
    
    top_products = []
    for item in top_products_result:
        product = await db.products.find_one({"id": item["_id"]})
        if product:
            top_products.append({
                "id": item["_id"],
                "name": product.get("name", {}),
                "sold": item["count"]
            })
    
    return DashboardStats(
        total_products=total_products,
        total_orders=total_orders,
        total_revenue=round(total_revenue, 2),
        total_customers=total_customers,
        pending_orders=pending_orders,
        low_stock_products=low_stock_products,
        recent_orders=[{
            "id": o.get("id"),
            "order_number": o.get("order_number"),
            "total": o.get("total"),
            "status": o.get("status"),
            "created_at": o.get("created_at").isoformat() if o.get("created_at") else None
        } for o in recent_orders],
        top_products=top_products
    )

@api_router.get("/admin/reports/sales")
async def get_sales_report(
    start_date: Optional[str] = None,
    end_date: Optional[str] = None
):
    query = {}
    if start_date:
        query["created_at"] = {"$gte": datetime.fromisoformat(start_date)}
    if end_date:
        if "created_at" in query:
            query["created_at"]["$lte"] = datetime.fromisoformat(end_date)
        else:
            query["created_at"] = {"$lte": datetime.fromisoformat(end_date)}
    
    # Daily sales
    pipeline = [
        {"$match": query},
        {
            "$group": {
                "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$created_at"}},
                "orders": {"$sum": 1},
                "revenue": {"$sum": "$total"}
            }
        },
        {"$sort": {"_id": 1}}
    ]
    daily_sales = await db.orders.aggregate(pipeline).to_list(100)
    
    # Category sales
    cat_pipeline = [
        {"$match": query},
        {"$unwind": "$items"},
        {
            "$group": {
                "_id": "$items.product_id",
                "quantity": {"$sum": "$items.quantity"},
                "revenue": {"$sum": "$items.total"}
            }
        }
    ]
    product_sales = await db.orders.aggregate(cat_pipeline).to_list(100)
    
    return {
        "daily_sales": daily_sales,
        "product_sales": product_sales
    }

# ==================== MOCK PAYMENT ====================

@api_router.post("/payment/mock")
async def process_mock_payment(order_id: str, success: bool = True):
    """Mock payment processor for testing"""
    order = await db.orders.find_one({"id": order_id})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    if success:
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {
                "payment_status": "paid",
                "status": "confirmed",
                "updated_at": datetime.utcnow()
            }}
        )
        return {"success": True, "message": "Payment successful", "transaction_id": f"MOCK-{uuid.uuid4()}"}
    else:
        await db.orders.update_one(
            {"id": order_id},
            {"$set": {"payment_status": "failed", "updated_at": datetime.utcnow()}}
        )
        return {"success": False, "message": "Payment failed"}

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_database():
    """Seed database with sample categories and products"""
    
    # Check if already seeded
    existing = await db.categories.count_documents({})
    if existing > 0:
        return {"message": "Database already seeded"}
    
    # Sample categories
    categories = [
        {
            "id": str(uuid.uuid4()),
            "name": {"nl": "Handgereedschap", "fr": "Outils à main", "en": "Hand Tools", "tr": "El Aletleri"},
            "description": {"nl": "Alle handgereedschappen", "fr": "Tous les outils à main", "en": "All hand tools", "tr": "Tüm el aletleri"},
            "is_active": True,
            "sort_order": 1,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": {"nl": "Elektrisch gereedschap", "fr": "Outils électriques", "en": "Power Tools", "tr": "Elektrikli Aletler"},
            "description": {"nl": "Elektrisch gereedschap", "fr": "Outils électriques", "en": "Power tools", "tr": "Elektrikli aletler"},
            "is_active": True,
            "sort_order": 2,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": {"nl": "Verf & Accessoires", "fr": "Peinture & Accessoires", "en": "Paint & Accessories", "tr": "Boya & Aksesuarlar"},
            "description": {"nl": "Verf en schilderbenodigdheden", "fr": "Peinture et fournitures de peinture", "en": "Paint and painting supplies", "tr": "Boya ve boya malzemeleri"},
            "is_active": True,
            "sort_order": 3,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": {"nl": "Bevestigingsmaterialen", "fr": "Fixations", "en": "Fasteners", "tr": "Bağlantı Elemanları"},
            "description": {"nl": "Schroeven, bouten en moeren", "fr": "Vis, boulons et écrous", "en": "Screws, bolts and nuts", "tr": "Vidalar, cıvatalar ve somunlar"},
            "is_active": True,
            "sort_order": 4,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": {"nl": "Sanitair", "fr": "Plomberie", "en": "Plumbing", "tr": "Sıhhi Tesisat"},
            "description": {"nl": "Sanitaire artikelen", "fr": "Articles de plomberie", "en": "Plumbing supplies", "tr": "Sıhhi tesisat malzemeleri"},
            "is_active": True,
            "sort_order": 5,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": {"nl": "Elektriciteit", "fr": "Électricité", "en": "Electrical", "tr": "Elektrik"},
            "description": {"nl": "Elektrische artikelen", "fr": "Articles électriques", "en": "Electrical supplies", "tr": "Elektrik malzemeleri"},
            "is_active": True,
            "sort_order": 6,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    await db.categories.insert_many(categories)
    
    # Sample products
    products = [
        {
            "id": str(uuid.uuid4()),
            "name": {"nl": "Professionele Hamer", "fr": "Marteau professionnel", "en": "Professional Hammer", "tr": "Profesyonel Çekiç"},
            "description": {"nl": "Hoogwaardige stalen hamer", "fr": "Marteau en acier de haute qualité", "en": "High quality steel hammer", "tr": "Yüksek kaliteli çelik çekiç"},
            "price": 24.99,
            "stock": 50,
            "sku": "HT-001",
            "category_id": categories[0]["id"],
            "images": [],
            "is_active": True,
            "unit": "piece",
            "brand": "Stanley",
            "specifications": {"weight": "500g", "material": "Steel"},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": {"nl": "Schroevendraaierset 12-delig", "fr": "Jeu de tournevis 12 pièces", "en": "Screwdriver Set 12-piece", "tr": "12 Parça Tornavida Seti"},
            "description": {"nl": "Complete set schroevendraaiers", "fr": "Jeu complet de tournevis", "en": "Complete set of screwdrivers", "tr": "Komple tornavida seti"},
            "price": 34.99,
            "stock": 30,
            "sku": "HT-002",
            "category_id": categories[0]["id"],
            "images": [],
            "is_active": True,
            "unit": "set",
            "brand": "Bosch",
            "specifications": {"pieces": "12", "type": "Various"},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": {"nl": "Accuboormachine 18V", "fr": "Perceuse sans fil 18V", "en": "Cordless Drill 18V", "tr": "Akülü Matkap 18V"},
            "description": {"nl": "Krachtige accuboormachine", "fr": "Perceuse sans fil puissante", "en": "Powerful cordless drill", "tr": "Güçlü akülü matkap"},
            "price": 129.99,
            "stock": 15,
            "sku": "PT-001",
            "category_id": categories[1]["id"],
            "images": [],
            "is_active": True,
            "unit": "piece",
            "brand": "DeWalt",
            "specifications": {"voltage": "18V", "battery": "2.0Ah"},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": {"nl": "Muurverf Wit 10L", "fr": "Peinture murale blanche 10L", "en": "Wall Paint White 10L", "tr": "Duvar Boyası Beyaz 10L"},
            "description": {"nl": "Witte muurverf voor binnen", "fr": "Peinture murale blanche pour intérieur", "en": "White wall paint for interior", "tr": "İç mekan için beyaz duvar boyası"},
            "price": 49.99,
            "stock": 25,
            "sku": "PA-001",
            "category_id": categories[2]["id"],
            "images": [],
            "is_active": True,
            "unit": "bucket",
            "brand": "Levis",
            "specifications": {"volume": "10L", "coverage": "80m²"},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": {"nl": "Schroeven Assortiment", "fr": "Assortiment de vis", "en": "Screw Assortment", "tr": "Vida Çeşitleri"},
            "description": {"nl": "500 schroeven in diverse maten", "fr": "500 vis de différentes tailles", "en": "500 screws in various sizes", "tr": "Çeşitli boyutlarda 500 vida"},
            "price": 19.99,
            "stock": 100,
            "sku": "FA-001",
            "category_id": categories[3]["id"],
            "images": [],
            "is_active": True,
            "unit": "box",
            "brand": "Fischer",
            "specifications": {"quantity": "500", "sizes": "3-6mm"},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        },
        {
            "id": str(uuid.uuid4()),
            "name": {"nl": "Waterkraan Mixer", "fr": "Robinet mitigeur", "en": "Mixer Tap", "tr": "Mikser Musluk"},
            "description": {"nl": "Moderne keukenkraan", "fr": "Robinet de cuisine moderne", "en": "Modern kitchen tap", "tr": "Modern mutfak musluğu"},
            "price": 79.99,
            "stock": 20,
            "sku": "PL-001",
            "category_id": categories[4]["id"],
            "images": [],
            "is_active": True,
            "unit": "piece",
            "brand": "Grohe",
            "specifications": {"material": "Chrome", "type": "Single lever"},
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow()
        }
    ]
    
    await db.products.insert_many(products)
    
    # Sample discount
    discount = {
        "id": str(uuid.uuid4()),
        "code": "WELCOME10",
        "name": {"nl": "Welkomstkorting", "fr": "Réduction de bienvenue", "en": "Welcome Discount", "tr": "Hoşgeldin İndirimi"},
        "description": {"nl": "10% korting op uw eerste bestelling", "fr": "10% de réduction sur votre première commande", "en": "10% off your first order", "tr": "İlk siparişinizde %10 indirim"},
        "discount_type": "percentage",
        "discount_value": 10,
        "min_order_amount": 50,
        "max_uses": 0,
        "used_count": 0,
        "is_active": True,
        "valid_from": datetime.utcnow(),
        "created_at": datetime.utcnow()
    }
    
    await db.discounts.insert_one(discount)
    
    return {"message": "Database seeded successfully", "categories": len(categories), "products": len(products)}

# Root endpoint
@api_router.get("/")
async def root():
    return {"message": "Belgian Hardware Store API", "version": "1.0.0"}

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
