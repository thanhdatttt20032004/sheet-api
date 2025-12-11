const express = require('express');
const bodyParser = require('body-parser');
const crypto = require('crypto');

const app = express();
app.use(bodyParser.json());

const PORT = process.env.PORT || 3000;
const VALID_APIKEYS = (process.env.VALID_APIKEYS || 'CheckCOGS,CheckStatus,CheckPriceBan').split(',');
const REQUIRE_AUTH_HEADER = (process.env.REQUIRE_AUTH_HEADER || 'false') === 'true';
const HEADER_TOKEN = process.env.HEADER_TOKEN || '';

function okJson(obj) { return Object.assign({ ok: true }, obj); }
function errJson(msg) { return { ok: false, error: msg }; }

app.use((req, res, next) => {
  if (!REQUIRE_AUTH_HEADER) return next();
  const auth = req.headers.authorization || '';
  if (!auth.startsWith('Bearer ')) return res.status(401).json(errJson('Missing Bearer token'));
  if (auth.substring(7) !== HEADER_TOKEN) return res.status(403).json(errJson('Invalid token'));
  next();
});

app.get('/getitem', (req, res) => {
  const apikey = (req.query.apikey || '').toString();
  const item = req.query.item || '';
  const warehouse = req.query.warehouse || '';

  if (VALID_APIKEYS.length && apikey && !VALID_APIKEYS.includes(apikey)) {
    return res.status(403).json(errJson('Invalid apikey'));
  }

  const stock = item ? (item.length * 7) % 101 : Math.floor(Math.random() * 101);

  return res.json(okJson({
    action: "checkStock",
    item,
    warehouse,
    stock,
    serverTime: new Date().toISOString()
  }));
});

app.post('/action', (req, res) => {
  const body = req.body || {};
  const action = (body.action || '').toLowerCase();
  const p1 = body.param1 || '';
  const p2 = body.param2 || '';

  if (!action) return res.status(400).json(errJson('Missing action'));

  if (action.includes('check')) {
    const stock = p1 ? (p1.length * 7) % 101 : Math.floor(Math.random() * 101);
    return res.json(okJson({
      action: "checkStock",
      item: p1,
      warehouse: p2,
      stock,
      serverTime: new Date().toISOString()
    }));
  }

  if (action.includes('ir') || action.includes('create')) {
    const ir = "IR-" + crypto.randomBytes(3).toString('hex').toUpperCase();
    return res.json(okJson({
      action: "createIR",
      irNo: ir,
      item: p1,
      qty: p2,
      serverTime: new Date().toISOString()
    }));
  }

  return res.json(okJson({
    echo: true,
    received: body,
    serverTime: new Date().toISOString()
  }));
});

app.get('/', (req, res) => {
  res.json({ ok: true, msg: "API Server is running", time: new Date().toISOString() });
});

app.listen(PORT, () => console.log("Running on port", PORT));
