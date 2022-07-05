import express, { Request, Response } from "express";
import axios from "axios";
const cheerio = require("cheerio");

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function getUniqueSiteLink(data: any, key: any) {
  return [...new Map(data.map((x: any) => [key(x), x])).values()];
}

function compare(a: any, b: any) {
  const siteLinkA = a.siteLink.toUpperCase();
  const siteLinkB = b.siteLink.toUpperCase();

  let comparison = 0;
  if (siteLinkA > siteLinkB) {
    comparison = 1;
  } else if (siteLinkA < siteLinkB) {
    comparison = -1;
  }
  return comparison;
}

app.post("/api/data", async (req: Request, res: Response) => {
  const { url } = req.body;
  try {
    const webData = await axios(url).then((response) => {
      const html = response.data;
      const capturedData = cheerio.load(html);
      const siteLinks: any = [];
      const links = capturedData("a");
      capturedData(links).each(function (_: any, link: string) {
        const name = capturedData(link).text().trim();
        const siteLink = capturedData(link).attr("href");
        siteLinks.push({
          name,
          siteLink,
        });
      });

      const results = siteLinks.filter((site: any) => {
        if (site.siteLink === "" || site.siteLink === undefined) {
          return false;
        }

        return true;
      });

      results.map((site: any) => {
        if (site.siteLink.startsWith("/")) {
          return (site.siteLink = `${url}${site.siteLink}`);
        } else if (
          site.siteLink.startsWith("www") | site.siteLink.startsWith("http")
        ) {
          return (site.siteLink = site.siteLink);
        } else {
          return (site.siteLink = `${url}/${site.siteLink}`);
        }
      });

      results.sort(compare);

      const uniqueLinks = getUniqueSiteLink(
        results,
        (result: any) => result.siteLink
      );

      return uniqueLinks;
    });
    res.json(webData);
  } catch {
    (err: any) => console.log(err);
  }
});

app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});
