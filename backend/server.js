// server/index.js
import express from "express";
import cors from "cors";
import { nanoid } from "nanoid";
import bodyParser from "body-parser";
// TODO: connect DB (Mongo via Mongoose or Postgres via Prisma)

const app = express();
app.use(cors());
app.use(bodyParser.json());

const makeRef = () => {
  const d = new Date();
  const yyyymmdd = d.toISOString().slice(0,10).replace(/-/g,""); // YYYYMMDD
  const code = nanoid(4).toUpperCase(); // short id
  return `GLS-${yyyymmdd}-${code}`;
};

// Products (public)
app.get("/api/products", async (req, res) => {
  // const items = await db.products.findMany({ where: { active: true }});
  res.json([]); // placeholder
});

// Create order → returns REF + WhatsApp link text payload
app.post("/api/orders", async (req, res) => {
  const { items, customer, shippingFee = 0, discount = 0 } = req.body;

  const subtotal = items.reduce((s,i)=> s + i.price * i.qty, 0);
  const total = Math.max(0, subtotal + shippingFee - discount);
  const ref = makeRef();

  // const order = await db.orders.create({ data: {...} });
  const order = { id: "temp", ref, total, items, customer, status: "pending" };

  const lineItems = items.map(i => `• ${i.title} x${i.qty} — ₦${i.price}`).join("%0A");
  const msg = [
    `Hello, I want to pay for my order.`,
    `Reference: ${ref}`,
    `Name: ${customer.fullName}`,
    `Phone: ${customer.phone}`,
    `Total: ₦${total.toLocaleString()}`,
    `Items:`,
    lineItems
  ].join("%0A"); // URL-encoded newlines for WhatsApp

  res.json({ ok: true, ref, total, orderId: order.id, whatsappMessage: msg });
});

// Mark paid (admin)
app.post("/api/orders/:id/mark-paid", async (req, res) => {
  // await db.orders.update({ where:{id:req.params.id}, data:{status:"paid"} });
  res.json({ ok: true });
});

app.post("/api/appointments", async (req, res) => {
  // save appointment
  res.json({ ok: true });
});

app.listen(4000, () => console.log("API running on :4000"));
``