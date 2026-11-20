# Jollies back office

Internal app for running the Jollies online bakery: operations, marketing and finance in one place.
Open `jollies/index.html` in a browser. Nothing to install, no server needed.

Starting data comes from the **Our Bakeshop!** Drive folder (20 Nov 2026): the menu, recipes,
inventory and schedule from *[Jollies] Operations*, the budget and KBank transactions from
*[Jollies] Finance*, the targets from *[Jollies] Marketing*, and the launch tasks from
*[Jollies] Management*. Sample and example rows from those sheets were left out.

## What's inside

| Area | Pages | What it does |
|---|---|---|
| Overview | Dashboard | Active batch, cut-off countdown, pieces to bake, cash, stock alerts, marketing and open tasks |
| Operations | Orders | Log pre-orders. Ship date is set automatically (Mon/Thu, cut-off 20:00 the evening before). Boxsets take a flavour mix |
| | Bake & pack | What to bake per flavour, ingredients needed vs on hand, capacity check, printable packing list, bulk status updates |
| | Inventory | On hand = opening + received + corrections − waste − used in baking. Reorder status and an automatic purchase list |
| | Menu & recipes | Prices, recipe-based cost, profit and margin per product |
| | Tasks | Launch checklist by area and owner |
| Marketing | Performance, Ads, Posts | ROAS, CTR, CPC, CPM, cost per result, engagement rate, judged against targets; orders by channel |
| Finance | Cash & P&L, Transactions, Budget | Balances per bank account, monthly cash flow, estimated P&L, budget vs actual for the 40,000 THB investment |

Marking an order **Paid** writes a Sales line to the SCB account automatically (you can switch this off in Settings).

## Data

Data is saved in the browser you use (localStorage), so each device has its own copy.
Use **Settings & backup → Export backup** to save a `.json` file and **Import backup** to load it on
another device. Orders, transactions and inventory can also be exported as CSV for Google Sheets.
