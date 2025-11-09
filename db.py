# db.py
import sqlite3
from config import DB_NAME

def get_conn():
    return sqlite3.connect(DB_NAME)

def init_db():
    conn = get_conn()
    cur = conn.cursor()

    cur.execute('''
        CREATE TABLE IF NOT EXISTS products (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT,
            description TEXT,
            price REAL,
            photo TEXT
        )
    ''')
    cur.execute('''
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            items TEXT,
            address TEXT,
            name TEXT,
            phone TEXT,
            payment TEXT,
            status TEXT
        )
    ''')

    # Первичная загрузка товаров
    cur.execute("SELECT COUNT(*) FROM products")
    if cur.fetchone()[0] == 0:
        example_products = [
            ("Брелок", "Аксессуар для ключей, стильный.", 150, "img/keychain.jpg"),
            ("Кружка", "Керамика, золотой обод.", 450, "img/mug.jpg"),
            ("Крем", "Натуральная косметика.", 650, "img/cream.jpg"),
            ("Зарядка", "Элегантная электроника.", 1200, "img/powerbank.jpg"),
            ("Кекс", "Домашняя выпечка.", 220, "img/cake.jpg"),
        ]
        cur.executemany(
            "INSERT INTO products (name, description, price, photo) VALUES (?, ?, ?, ?)",
            example_products
        )
        conn.commit()
    conn.close()

def get_products():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, name, description, price, photo FROM products")
    res = [
        {"id": r[0], "name": r[1], "description": r[2], "price": r[3], "photo": r[4]}
        for r in cur.fetchall()
    ]
    conn.close()
    return res

def get_product(pid: int):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute("SELECT id, name, description, price, photo FROM products WHERE id=?", (pid,))
    r = cur.fetchone()
    conn.close()
    if r:
        return {"id": r[0], "name": r[1], "description": r[2], "price": r[3], "photo": r[4]}
    return None

def add_order(user_id, items, address, name, phone, payment, status="new"):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "INSERT INTO orders (user_id, items, address, name, phone, payment, status) VALUES (?, ?, ?, ?, ?, ?, ?)",
        (user_id, items, address, name, phone, payment, status)
    )
    oid = cur.lastrowid
    conn.commit()
    conn.close()
    return oid

def get_orders(user_id):
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, items, address, name, phone, payment, status FROM orders WHERE user_id=? ORDER BY id DESC",
        (user_id,)
    )
    res = []
    for r in cur.fetchall():
        res.append({
            "id": r[0], "items": r[1], "address": r[2], "name": r[3],
            "phone": r[4], "payment": r[5], "status": r[6],
        })
    conn.close()
    return res

def get_all_orders():
    conn = get_conn()
    cur = conn.cursor()
    cur.execute(
        "SELECT id, user_id, items, address, name, phone, payment, status FROM orders ORDER BY id DESC"
    )
    res = []
    for r in cur.fetchall():
        res.append({
            "id": r[0], "user_id": r[1], "items": r[2], "address": r[3], "name": r[4],
            "phone": r[5], "payment": r[6], "status": r[7],
        })
    conn.close()
    return res