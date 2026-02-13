import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = ["Шини", "Автотовари"];

const tireSpeedIndices = [
  { code: "B", maxKph: 50 },
  { code: "C", maxKph: 60 },
  { code: "D", maxKph: 65 },
  { code: "E", maxKph: 70 },
  { code: "F", maxKph: 80 },
  { code: "G", maxKph: 90 },
  { code: "J", maxKph: 100 },
  { code: "K", maxKph: 110 },
  { code: "L", maxKph: 120 },
  { code: "M", maxKph: 130 },
  { code: "N", maxKph: 140 },
  { code: "P", maxKph: 150 },
  { code: "Q", maxKph: 160 },
  { code: "R", maxKph: 170 },
  { code: "S", maxKph: 180 },
  { code: "T", maxKph: 190 },
  { code: "U", maxKph: 200 },
  { code: "H", maxKph: 210 },
  { code: "V", maxKph: 240 },
  { code: "ZR", maxKph: 240 },
  { code: "W", maxKph: 270 },
  { code: "Y", maxKph: 300 }
];

const tireLoadIndices = [
  { code: "0", maxKg: 45 },
  { code: "1", maxKg: 46.2 },
  { code: "2", maxKg: 47.5 },
  { code: "3", maxKg: 48.7 },
  { code: "4", maxKg: 50 },
  { code: "5", maxKg: 51.5 },
  { code: "6", maxKg: 53 },
  { code: "7", maxKg: 54.5 },
  { code: "8", maxKg: 56 },
  { code: "9", maxKg: 58 },
  { code: "10", maxKg: 60 },
  { code: "11", maxKg: 61.5 },
  { code: "12", maxKg: 63 },
  { code: "13", maxKg: 65 },
  { code: "14", maxKg: 67 },
  { code: "15", maxKg: 69 },
  { code: "16", maxKg: 71 },
  { code: "17", maxKg: 73 },
  { code: "18", maxKg: 75 },
  { code: "19", maxKg: 77.5 },
  { code: "20", maxKg: 80 },
  { code: "21", maxKg: 82.5 },
  { code: "22", maxKg: 86 },
  { code: "23", maxKg: 87.5 },
  { code: "24", maxKg: 90 },
  { code: "25", maxKg: 92.5 },
  { code: "26", maxKg: 95 },
  { code: "27", maxKg: 97.5 },
  { code: "28", maxKg: 100 },
  { code: "29", maxKg: 103 },
  { code: "30", maxKg: 106 },
  { code: "31", maxKg: 109 },
  { code: "32", maxKg: 112 },
  { code: "33", maxKg: 115 },
  { code: "34", maxKg: 118 },
  { code: "35", maxKg: 121 },
  { code: "36", maxKg: 125 },
  { code: "37", maxKg: 128 },
  { code: "38", maxKg: 132 },
  { code: "39", maxKg: 136 },
  { code: "40", maxKg: 140 },
  { code: "41", maxKg: 145 },
  { code: "42", maxKg: 150 },
  { code: "43", maxKg: 155 },
  { code: "44", maxKg: 160 },
  { code: "45", maxKg: 165 },
  { code: "46", maxKg: 170 },
  { code: "47", maxKg: 175 },
  { code: "48", maxKg: 180 },
  { code: "49", maxKg: 185 },
  { code: "50", maxKg: 190 },
  { code: "51", maxKg: 195 },
  { code: "52", maxKg: 200 },
  { code: "53", maxKg: 206 },
  { code: "54", maxKg: 212 },
  { code: "55", maxKg: 218 },
  { code: "56", maxKg: 224 },
  { code: "57", maxKg: 230 },
  { code: "58", maxKg: 236 },
  { code: "59", maxKg: 243 },
  { code: "60", maxKg: 250 },
  { code: "61", maxKg: 257 },
  { code: "62", maxKg: 265 },
  { code: "63", maxKg: 272 },
  { code: "64", maxKg: 280 },
  { code: "65", maxKg: 290 },
  { code: "66", maxKg: 300 },
  { code: "67", maxKg: 307 },
  { code: "68", maxKg: 315 },
  { code: "69", maxKg: 325 },
  { code: "70", maxKg: 335 },
  { code: "71", maxKg: 345 },
  { code: "72", maxKg: 355 },
  { code: "73", maxKg: 365 },
  { code: "74", maxKg: 375 },
  { code: "75", maxKg: 387 },
  { code: "76", maxKg: 400 },
  { code: "77", maxKg: 412 },
  { code: "78", maxKg: 425 },
  { code: "79", maxKg: 437 },
  { code: "80", maxKg: 450 },
  { code: "81", maxKg: 462 },
  { code: "82", maxKg: 475 },
  { code: "83", maxKg: 487 },
  { code: "84", maxKg: 500 },
  { code: "85", maxKg: 515 },
  { code: "86", maxKg: 530 },
  { code: "87", maxKg: 545 },
  { code: "88", maxKg: 560 },
  { code: "89", maxKg: 580 },
  { code: "90", maxKg: 600 },
  { code: "91", maxKg: 615 },
  { code: "92", maxKg: 630 },
  { code: "93", maxKg: 650 },
  { code: "94", maxKg: 670 },
  { code: "95", maxKg: 690 },
  { code: "96", maxKg: 710 },
  { code: "97", maxKg: 730 },
  { code: "98", maxKg: 750 },
  { code: "99", maxKg: 775 },
  { code: "100", maxKg: 800 },
  { code: "101", maxKg: 825 },
  { code: "102", maxKg: 850 },
  { code: "103", maxKg: 875 },
  { code: "104", maxKg: 900 },
  { code: "105", maxKg: 925 },
  { code: "106", maxKg: 950 },
  { code: "107", maxKg: 975 },
  { code: "108", maxKg: 1000 },
  { code: "109", maxKg: 1030 },
  { code: "110", maxKg: 1060 },
  { code: "111", maxKg: 1090 },
  { code: "112", maxKg: 1120 },
  { code: "113", maxKg: 1150 },
  { code: "114", maxKg: 1180 },
  { code: "115", maxKg: 1215 },
  { code: "116", maxKg: 1250 },
  { code: "117", maxKg: 1285 },
  { code: "118", maxKg: 1320 },
  { code: "119", maxKg: 1360 },
  { code: "120", maxKg: 1400 },
  { code: "121", maxKg: 1450 },
  { code: "122", maxKg: 1500 },
  { code: "123", maxKg: 1550 },
  { code: "124", maxKg: 1600 },
  { code: "125", maxKg: 1650 },
  { code: "126", maxKg: 1700 },
  { code: "127", maxKg: 1750 },
  { code: "128", maxKg: 1800 },
  { code: "129", maxKg: 1850 },
  { code: "130", maxKg: 1900 },
  { code: "131", maxKg: 1950 },
  { code: "132", maxKg: 2000 },
  { code: "133", maxKg: 2060 },
  { code: "134", maxKg: 2120 },
  { code: "135", maxKg: 2180 },
  { code: "136", maxKg: 2240 },
  { code: "137", maxKg: 2300 },
  { code: "138", maxKg: 2360 },
  { code: "139", maxKg: 2430 },
  { code: "140", maxKg: 2500 },
  { code: "141", maxKg: 2575 },
  { code: "142", maxKg: 2650 },
  { code: "143", maxKg: 2725 },
  { code: "144", maxKg: 2800 },
  { code: "145", maxKg: 2900 },
  { code: "146", maxKg: 3000 },
  { code: "147", maxKg: 3075 },
  { code: "148", maxKg: 3150 },
  { code: "149", maxKg: 3250 },
  { code: "150", maxKg: 3350 }
];

const tireBrands = [
  "Michelin",
  "Continental",
  "Bridgestone",
  "Goodyear",
  "Pirelli",
  "Nokian",
  "Hankook",
  "Kormoran",
  "Grenlander",
  "Kustone",
  "Tourador",
  "Laufenn",
  "Kleber",
  "Ardent",
  "Habilead"
];

const grenlanderModels = [
  "L-GRIP16",
  "COLO H01",
  "COLO H02",
  "L-COMFORT 68",
  "KINGPRO ONE",
  "L-ZEAL 56",
  "ENRI U08",
  "DIAS ZERO",
  "MAHO 77",
  "MAHO 79",
  "MAGA A/T ONE",
  "MAGA A/T TWO",
  "CONQUEWIND R/T",
  "DRAK M/T",
  "PREDATOR M/T",
  "L-MAX 9",
  "STRATOUR E1",
  "L-POWER 28",
  "GREENWING A/S",
  "GREENTOUR A/S"
];

const seed = async () => {
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  for (const index of tireSpeedIndices) {
    await prisma.tireSpeedIndex.upsert({
      where: { code: index.code },
      update: { maxKph: index.maxKph },
      create: index
    });
  }
  for (const index of tireLoadIndices) {
    await prisma.tireLoadIndex.upsert({
      where: { code: index.code },
      update: { maxKg: index.maxKg },
      create: index
    });
  }

  for (const name of tireBrands) {
    await prisma.tireBrand.upsert({
      where: { name },
      update: {},
      create: { name }
    });
  }

  const grenlanderBrand = await prisma.tireBrand.findUnique({
    where: { name: "Grenlander" }
  });
  if (grenlanderBrand) {
    for (const modelName of grenlanderModels) {
      await prisma.tireModel.upsert({
        where: {
          name_brandId: {
            name: modelName,
            brandId: grenlanderBrand.id
          }
        },
        update: {},
        create: {
          name: modelName,
          brandId: grenlanderBrand.id
        }
      });
    }
  }
};

seed()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
