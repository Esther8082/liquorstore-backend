import { API_BASE_URL } from "../config/api.js";

export async function printReceipt(saleId, reprint = false) {


    const receipt =
    await fetch(`${API_BASE_URL}/sales/${saleId}`);

    if (!receipt.ok) {

    throw new Error("Unable to load receipt.");

}


const sale = await receipt.json();


let paymentDetails = "++";

if (sale.payment_method === "cash") {

    paymentDetails = `
        <p>Cash: R ${Number(sale.amount_paid).toFixed(2)}</p>
        <p>Change: R ${Number(sale.change_given).toFixed(2)}</p>
    `;

}
else if (sale.payment_method === "card") {

    paymentDetails = `
        <p>Card: R ${Number(sale.card_amount).toFixed(2)}</p>
    `;

}
else {

    paymentDetails = `
        <p>Cash: R ${Number(sale.cash_amount).toFixed(2)}</p>
        <p>Card: R ${Number(sale.card_amount).toFixed(2)}</p>
        <p>Change: R ${Number(sale.change_given).toFixed(2)}</p>
    `;

}

const receiptWindow =
    window.open("", "_blank", "width=320,height=450");

receiptWindow.document.write(`

<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>Receipt</title>

<style>

html,
body {

    margin: 0;
    padding: 0;
    width: 80mm;
    font-family: monospace;
    font-size: 14px;
}

body {

    padding: 7px;
    box-sizing: border-box;
}

h2 {

    text-align: center;
    margin: 0 0 8px;
}

p {

    margin: 3px 0;
}

hr {

    border: none;
    border-top: 1px dashed #000;
    margin: 5px 0;
}
.header{
    text-align:center;
    margin-bottom:10px;
}

.header h2{
    margin:0;
}

.header p{
    margin:2px 0;
}

.reprint-banner{

    margin-top:10px;

    text-align:center;

    font-weight:bold;

    font-size:16px;

    letter-spacing:2px;

}

.footer{
    text-align:center;
    margin-top:10px;
}

.footer-message{
    font-weight:bold;
    margin:8px 0;
}

.footer-warning{
    font-size:12px;
    margin-top:8px;
}

.item {

    display: flex;
    justify-content: space-between;
    margin: 2px 0;
}

.total {

    font-weight: bold;
}

@page {

 margin: 5mm;
}

@media print {

    html,
    body {

        width: 80mm;
      
    }
}

</style>

</head>

<body>

<div class="header">

<h2>MAL INN EATING HOUSE</h2>

<p>
Stand No. 271<br>
Mkhuhlu Township<br>
Mpumalanga 1246
</p>

<p>
Tel: 072 883 0106
</p>

${reprint ? `
<div class="reprint-banner">
    *** REPRINT ***
</div>
` : ""}

</div>

<hr>

<p>
Receipt No: ${sale.receipt_number}
</p>

<p>
${new Date(sale.created_at).toLocaleString()}
</p>

<p>
Customer: ${sale.customer_name}
</p>

<br>

<hr>

<hr>

<br>

<div class="item item-header">

<span><strong>Item</strong></span>

<span><strong>Total</strong></span>

</div>

<br>

<hr>

${sale.items.map(item => `

    <br>

<div class="item">

<span>

${item.item_name} x${item.quantity}

</span>

<span>

R ${Number(item.line_total).toFixed(2)}

</span>

</div>

`).join("")}

<hr>

<div class="item total">

<span>Total</span>

<span>R ${Number(sale.total).toFixed(2)}</span>

</div>

${paymentDetails}

<br>

<hr>

<div class="footer">

<p class="footer-message">
THANK YOU FOR YOUR PURCHASE
</p>

<p class="footer-warning">
NO ALCOHOL SOLD TO PERSONS<br>
UNDER THE AGE OF 18
</p>

</div>

<script>

window.onload = function(){

    window.print();

    window.onafterprint = function(){

        window.close();

    };

};

<\/script>

</body>

</html>

`);

    receiptWindow.document.close();

}