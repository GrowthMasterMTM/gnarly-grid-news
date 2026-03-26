import type { Parser } from "./types";
import { SvemoParser } from "./svemo-parser";
import { FimParser } from "./fim-parser";
import { EnduroGpParser } from "./endurogp-parser";
import { DemParser } from "./dem-parser";
import { SuperEnduroParser } from "./superenduro-parser";
import { MxgpParser } from "./mxgp-parser";
import { RaceMagazineParser } from "./racemagazine-parser";

const parsers: Record<string, () => Parser> = {
  svemo: () => new SvemoParser(),
  "fim-news": () => new FimParser({ key: "fim-news" }),
  "fim-enduro": () =>
    new FimParser({
      key: "fim-enduro",
      disciplineFilter: "Enduro",
      defaultSport: "enduro",
      pagesToFetch: 5,
    }),
  endurogp: () => new EnduroGpParser(),
  dem: () => new DemParser(),
  superenduro: () => new SuperEnduroParser(),
  mxgp: () => new MxgpParser(),
  racemagazine: () => new RaceMagazineParser(),
};

export function getParser(key: string): Parser {
  const factory = parsers[key];
  if (!factory) {
    throw new Error(`No parser registered for key: ${key}`);
  }
  return factory();
}
