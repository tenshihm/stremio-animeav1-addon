// server.js
const express = require("express");
const app = express();
const addonInterface = require("./index");

app.get("/manifest.json", (req, res) => {
  res.send(addonInterface.manifest);
});

app.get("/:resource/:type/:id.json", async (req, res) => {
  const { resource, type, id } = req.params;
  const handler = addonInterface.get(resource);

  try {
    const result = await handler({
      type,
      id,
      extra: req.query
    });
    res.send(result);
  } catch (e) {
    console.error(e);
    res.status(500).send({ error: "Error en el addon" });
  }
});

app.listen(7000, () => {
  console.log("✅ Addon corriendo en http://localhost:7000/manifest.json");
})
