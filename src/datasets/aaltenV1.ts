import type { Dataset, Point } from "@/domain/types";
import { createRandom, hashString } from "@/lib/random";
import { AALTEN_RAW } from "./aaltenRaw";

const POSTAL_RE = /\b(\d{4}\s?[A-Z]{2})\b/;

type ParsedRecord = {
  address: string;
  city: string;
  postalCode?: string;
  street: string;
  houseNumber: number;
  tags: string[];
};

export function parseAaltenLine(line: string): ParsedRecord | null {
  const trimmed = line.trim();
  if (!trimmed) return null;
  const [addressPart, tagPart = ""] = trimmed.split(";");
  const address = addressPart.trim();
  const tags = tagPart
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);

  const postalMatch = address.match(POSTAL_RE);
  const postalCode = postalMatch ? postalMatch[1] : undefined;

  const cityMatch = address.match(/(AALTEN|Aalten)\s*$/);
  const city = cityMatch ? cityMatch[1] : "Aalten";

  let core = address;
  if (cityMatch) core = core.slice(0, cityMatch.index).trim();
  if (postalCode) core = core.replace(POSTAL_RE, "").trim();

  const numberMatch = core.match(/\d+/);
  const street = (numberMatch ? core.slice(0, numberMatch.index) : core).trim();
  const houseNumber = numberMatch ? Number(numberMatch[0]) : 0;

  return { address, city, postalCode, street, houseNumber, tags };
}

/**
 * Deterministic synthetic coordinates (Mode A).
 * Streets become spatial clusters; house numbers run along the street axis.
 * Real latitude/longitude can be attached later (Mode B) without touching
 * the ordering architecture.
 */
function projectRecords(records: ParsedRecord[], seed: number): Point[] {
  const streets = [...new Set(records.map((r) => r.street))];
  const random = createRandom(seed);
  const anchors = new Map<string, { x: number; y: number; dx: number; dy: number }>();

  streets.forEach((street, index) => {
    const h = hashString(`${street}#${seed}`);
    const golden = 2.399963;
    const angle = index * golden + (h % 1000) / 1000;
    const radius = 8 + Math.sqrt(index + 1) * 5.5 + ((h >>> 8) % 100) / 40;
    const dirAngle = ((h >>> 16) % 360) * (Math.PI / 180);
    anchors.set(street, {
      x: 50 + Math.cos(angle) * radius,
      y: 50 + Math.sin(angle) * radius * 0.82,
      dx: Math.cos(dirAngle),
      dy: Math.sin(dirAngle),
    });
  });

  return records.map((record, index) => {
    const anchor = anchors.get(record.street)!;
    const along = (record.houseNumber % 60) * 0.11;
    const side = record.houseNumber % 2 === 0 ? 0.5 : -0.5;
    const jitter = () => (random() - 0.5) * 0.5;
    const x = anchor.x + anchor.dx * along - anchor.dy * side + jitter();
    const y = anchor.y + anchor.dy * along + anchor.dx * side + jitter();
    return {
      id: `P${String(index + 1).padStart(3, "0")}`,
      address: record.address,
      city: record.city,
      postalCode: record.postalCode,
      street: record.street,
      tags: record.tags,
      originalIndex: index + 1,
      coordinate: { x: Number(x.toFixed(3)), y: Number(y.toFixed(3)) },
      cluster: record.street,
    };
  });
}

export const AALTEN_SEED = 20240711;

export function buildAaltenDataset(): Dataset {
  const records = AALTEN_RAW.split("\n")
    .map(parseAaltenLine)
    .filter((r): r is ParsedRecord => r !== null);
  const points = projectRecords(records, AALTEN_SEED);

  return {
    id: "aalten-ordering-test",
    name: "Aalten Ordering Test",
    version: "V1",
    kind: "real",
    description:
      "Fixed real-world benchmark list of Aalten addresses with their original delivery tags. Coordinates are deterministic synthetic projections (street clusters), so the lab runs fully offline.",
    seed: AALTEN_SEED,
    points,
    depotId: points[0]?.id ?? null,
  };
}

export const aaltenV1 = buildAaltenDataset();

export const AALTEN_TAGS = [...new Set(aaltenV1.points.flatMap((p) => p.tags))].sort();
