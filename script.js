const root = document.getElementById("page");
const cartBtn = document.getElementById("cartBtn");
let products = [];
let cart = [];

let user_id;
if (window.Telegram && Telegram.WebApp) {
    Telegram.WebApp.expand();
    Telegram.WebApp.ready();
    user_id = Telegram.WebApp.initDataUnsafe.user ? Telegram.WebApp.initDataUnsafe.user.id : null;
} else {
    user_id = "testuser";
}

// Notify + fly animation
function notify(msg) {
    let el = document.createElement("div");
    el.className = "notify";
    el.innerHTML = msg;
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 2000);
}

// Картинка анимации перелёта
function flyToCart(cardImg) {
    let rect = cardImg.getBoundingClientRect();
    let float = cardImg.cloneNode(true);
    float.style.position = "absolute";
    float.className = "cart-float";
    float.style.left = rect.left + "px";
    float.style.top = rect.top + "px";
    document.body.appendChild(float);
    setTimeout(() => float.remove(), 800);
}

// --- Render: catalog
function showCatalog() {
    root.innerHTML = "";
    let list = document.createElement("div");
    products.forEach((p, i) => {
        let card = document.createElement("div");
        card.className = "card fade";
        setTimeout(() => card.classList.add("fade"), 100*i);

        let imgBox = document.createElement("div");
        imgBox.className = "cardimg-box";
        let img = document.createElement("img");
        img.src = p.photo;
        img.alt = p.name;
        imgBox.appendChild(img);

        let cnt = document.createElement("div");
        cnt.className = "card-content";
        let title = document.createElement("div");
        title.className = "card-title"; title.innerText = p.name;
        let desc = document.createElement("div");
        desc.className = "card-desc"; desc.innerText = p.description;
        let price = document.createElement("div");
        price.className = "card-price"; price.innerText = p.price + "₽";
        let btn = document.createElement("button");
        btn.className = "btn"; btn.innerText = "В корзину";
        btn.onclick = () => {
            let found = cart.find(it => it.id === p.id);
            if (found) {
                found.count += 1;
            } else {
                cart.push({ ...p, count: 1 });
            }
            flyToCart(img);
            notify("Добавлено в корзину 🛒");
            updateCartBtn();
        };
        cnt.append(title, desc, price, btn);

        card.append(imgBox, cnt);
        list.appendChild(card);
    });
    root.appendChild(list);
}

// --- Render: cart
function showCart() {
    root.innerHTML = "";
    let box = document.createElement("div");
    box.className = "order-box fade";
    let title = document.createElement("div");
    title.className = "order-title"; title.innerText = "Ваша корзина";
    box.appendChild(title);

    if (!cart.length) {
        box.appendChild(document.createTextNode("Корзина пуста."));
        root.appendChild(box);
        return;
    }
    let total = 0;
    cart.forEach((item, idx) => {
        let row = document.createElement("div");
        row.style.marginBottom = "19px";
        row.innerHTML = `<b>${item.name}</b> x ${item.count} — <span style="color:#c9a66b">${item.price * item.count}₽</span>`;
        total += item.price * item.count;

        let ce = document.createElement("div");
        ce.className = "count-edit";
        let btnDec = document.createElement("button");
        btnDec.className = "count-btn"; btnDec.innerText = "-";
        btnDec.onclick = () => {
            item.count -= 1;
            if (item.count <= 0) {
                cart.splice(idx, 1);
            }
            notify("Изменено!"); updateCartBtn(); showCart();
        };
        let btnInc = document.createElement("button");
        btnInc.className = "count-btn"; btnInc.innerText = "+";
        btnInc.onclick = () => { item.count += 1; notify("Изменено!"); updateCartBtn(); showCart(); };
        let btnDel = document.createElement("button");
        btnDel.className = "count-btn"; btnDel.innerText = "❌";
        btnDel.onclick = () => { cart.splice(idx, 1); notify("Удалено!"); updateCartBtn(); showCart(); };
        ce.append(btnDec, btnInc, btnDel);
        row.appendChild(ce);

        box.appendChild(row);
    });

    let totalBox = document.createElement("div");
    totalBox.style.marginTop = "15px"; totalBox.style.fontWeight = "700";
    totalBox.innerHTML = `Итого: <span style="color:#c9a66b">${total}₽</span>`;
    box.appendChild(totalBox);

    let btnOrder = document.createElement("button");
    btnOrder.className = "btn gold";
    btnOrder.innerText = "Оформить заказ";
    btnOrder.onclick = showOrderForm;
    box.appendChild(btnOrder);

    root.appendChild(box);
}

// --- Render: order
function showOrderForm() {
    root.innerHTML = "";
    let box = document.createElement("div");
    box.className = "order-box fade";
    let title = document.createElement("div");
    title.className = "order-title"; title.innerText = "Оформление заказа";
    box.appendChild(title);

    function makeLabel(txt) { let l=document.createElement('label');l.className="order-label";l.innerText=txt;return l;}
    let name = document.createElement("input"); name.placeholder="Имя"; name.className="input";
    let phone = document.createElement("input"); phone.placeholder="+7..."; phone.className="input";
    let addr = document.createElement("input"); addr.placeholder="Адрес"; addr.className="input";
    let payLabel = makeLabel("Способ оплаты");
    let paySel = document.createElement("select"); paySel.className="input";
    ["Наложенный платеж", "Онлайн (тест)"].forEach(t=>{
        let o=document.createElement("option");o.value=t;o.innerText=t;paySel.appendChild(o);
    });

    let btnConfirm = document.createElement("button");
    btnConfirm.className="btn gold"; btnConfirm.innerText="Подтвердить";
    btnConfirm.onclick = async () => {
        btnConfirm.disabled = true;
        btnConfirm.innerText = "Отправка...";
        let orderData = {
            user_id, name: name.value, phone: phone.value, address: addr.value,
            payment: paySel.value,
            items: JSON.stringify(cart.map(x => ({name:x.name, count:x.count, price:x.price}))),
        };
        let resp = await fetch("/order", {
            method: "POST",
            headers: {"Content-Type":"application/json"},
            body: JSON.stringify(orderData),
        });
        let data = await resp.json();
        cart = [];
        updateCartBtn();
        showConfirm(data.order_id);
    };

    box.append(makeLabel("Имя"), name, makeLabel("Телефон"), phone, makeLabel("Адрес"), addr, payLabel, paySel, btnConfirm);

    root.appendChild(box);
}

// --- Render: confirm
function showConfirm(orderId) {
    root.innerHTML = "";
    let box = document.createElement("div");
    box.className = "order-box fade";
    let title = document.createElement("div");
    title.className = "confirm-title"; title.innerText = "✅ Заказ создан!";
    let text = document.createElement("div");
    text.innerText = "Спасибо за заказ.\nСкоро мы с вами свяжемся.\nНомер заказа: " + orderId;
    box.append(title, text);
    root.appendChild(box);
}

// кнопка корзины индикатор
function updateCartBtn() {
    cartBtn.className = "btn gold";
    if(cart.length) cartBtn.classList.add("active");
}

// Старт и навигация
cartBtn.onclick = showCart;

window.onload = async function() {
    const resp = await fetch("/products");
    products = await resp.json();
    showCatalog();
    updateCartBtn();
    cartBtn.classList.remove("active");
};