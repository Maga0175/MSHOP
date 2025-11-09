import logging
import db
from config import BOT_TOKEN, ADMIN_ID, WEBAPP_URL
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from aiogram.filters import Command
from aiogram import Bot, Dispatcher, types
from aiogram.client.default import DefaultBotProperties
from aiogram.types import ReplyKeyboardMarkup, KeyboardButton, WebAppInfo
import asyncio

logging.basicConfig(level=logging.INFO)

bot = Bot(token=BOT_TOKEN, default=DefaultBotProperties(parse_mode='HTML'))
dp = Dispatcher()
app = FastAPI()

# --- Уведомление о заказе (из WebApp)
@app.post("/order")
async def create_order(request: Request):
    data = await request.json()
    user_id = int(data["user_id"])
    address = data["address"]
    name = data["name"]
    phone = data["phone"]
    payment = data["payment"]
    items = data["items"]   # JSON строка
    oid = db.add_order(user_id, items, address, name, phone, payment)

    await bot.send_message(
        user_id,
        f"🛒 Заказ принят!\n<i>Мы обработаем ваш заказ #{oid}.</i>"
    )
    await bot.send_message(
        ADMIN_ID,
        f"✨ <b>Новый заказ #{oid}</b>\nПользователь: <code>{user_id}</code>\n"
        f"Товары: {items}\nИмя: {name}\nТел: {phone}\nАдрес: {address}\nОплата: {payment}"
    )
    return JSONResponse({"ok": True, "order_id": oid})

@app.get("/products")
async def api_products():
    return db.get_products()

app.mount("/webapp", StaticFiles(directory="webapp", html=True), name="webapp")
app.mount("/img", StaticFiles(directory="webapp/img"), name="img")

@dp.message(Command("start"))
async def start_command(message: types.Message):
    kb = ReplyKeyboardMarkup(
        keyboard=[
            [KeyboardButton(text="Открыть магазин", web_app=WebAppInfo(url=WEBAPP_URL))]
        ],
        resize_keyboard=True
    )
    await message.answer(
        "🌱 Добро пожаловать в магазин!\nДля заказа используйте WebApp.",
        reply_markup=kb
    )

async def fastapi_runner():
    import uvicorn
    config = uvicorn.Config(app=app, host='0.0.0.0', port=8000, log_level="info")
    server = uvicorn.Server(config)
    await server.serve()

async def main():
    db.init_db()
    await asyncio.gather(
        dp.start_polling(bot),
        fastapi_runner()
    )

if __name__ == "__main__":
    asyncio.run(main())