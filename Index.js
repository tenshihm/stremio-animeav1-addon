// index.js
const { addonBuilder } = require("stremio-addon-sdk");
const axios = require("axios");
const cheerio = require("cheerio");

const manifest = {
  id: "org.anime.multifuente.av1",
  version: "1.0.0",
  name: "Anime Multifuente (Latino)",
  description: "Addon que reproduce anime desde animeav1.com con múltiples servidores.",
  types: ["series"],
  catalogs: [
    {
      type: "series",
      id: "animeav1_catalog",
      name: "AnimeAV1 - Catálogo",
      extra: [{ name: "search", isRequired: false }],
    },
  ],
  resources: ["catalog", "meta", "stream"],
  idPrefixes: ["animeav1_"],
  logo: "https://animeav1.com/wp-content/uploads/2021/12/logoanimeav1.png",
};

const builder = new addonBuilder(manifest);

// CATÁLOGO
builder.defineCatalogHandler(async ({ extra }) => {
  const metas = [];

  let url = "https://animeav1.com/";
  if (extra.search) {
    url = `https://animeav1.com/?s=${encodeURIComponent(extra.search)}`;
  }

  const res = await axios.get(url);
  const $ = cheerio.load(res.data);

  $(".anime__item").each((i, el) => {
    const title = $(el).find(".anime__item__text h5 a").text().trim();
    const link = $(el).find("a").attr("href");
    const poster = $(el).find("img").attr("data-src") || "";

    if (title && link) {
      metas.push({
        id: `animeav1_${encodeURIComponent(link)}`,
        type: "series",
        name: title,
        poster,
      });
    }
  });

  return { metas };
});

// METADATOS
builder.defineMetaHandler(async ({ id }) => {
  const realUrl = decodeURIComponent(id.replace("animeav1_", ""));
  const res = await axios.get(realUrl);
  const $ = cheerio.load(res.data);

  const name = $("h1").first().text().trim();
  const poster = $(".anime__details__pic img").attr("src");

  return {
    meta: {
      id,
      type: "series",
      name,
      poster,
    },
  };
});

// STREAMS
builder.defineStreamHandler(async ({ id }) => {
  const realUrl = decodeURIComponent(id.replace("animeav1_", ""));
  const res = await axios.get(realUrl);
  const $ = cheerio.load(res.data);

  const streams = [];

  $("iframe").each((i, el) => {
    const src = $(el).attr("src");
    if (src && src.startsWith("http")) {
      streams.push({
        title: `Servidor ${i + 1}`,
        url: src,
        behaviorHints: {
          notWebReady: false,
          proxyHeaders: {
            request: {
              referer: realUrl,
              origin: "https://animeav1.com",
            },
          },
        },
      });
    }
  });

  return { streams };
});

module.exports = builder.getInterface()
