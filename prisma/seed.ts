import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEFAULT_PAYMENT_METHODS = [
  { id: "nakit", name: "Nakit", komisyonOrani: 0, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 0 },
  { id: "kredi-karti", name: "Kredi Karti", komisyonOrani: 1.79, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 1 },
  { id: "banka-karti", name: "Banka Karti", komisyonOrani: 0.95, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 2 },
  { id: "havale-eft", name: "Havale/EFT", komisyonOrani: 0, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 3 },
  { id: "yemek-karti", name: "Yemek Karti", komisyonOrani: 5.0, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 4 },
  { id: "online-odeme", name: "Online Odeme", komisyonOrani: 2.5, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 5 },
  { id: "multinet", name: "Multinet", komisyonOrani: 5.0, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 6 },
  { id: "sodexo", name: "Sodexo", komisyonOrani: 5.0, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 7 },
  { id: "ticket", name: "Ticket", komisyonOrani: 5.0, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 8 },
  { id: "metropol", name: "Metropol", komisyonOrani: 5.0, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 9 },
  { id: "setcard", name: "Setcard", komisyonOrani: 5.0, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 10 },
  { id: "iyzico", name: "iyzico", komisyonOrani: 2.99, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 11 },
  { id: "paypal", name: "PayPal", komisyonOrani: 3.4, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 12 },
  { id: "param", name: "Param", komisyonOrani: 2.79, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 13 },
  { id: "paycell", name: "Paycell", komisyonOrani: 2.5, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 14 },
  { id: "hopi", name: "Hopi", komisyonOrani: 3.0, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 15 },
  { id: "tosla", name: "Tosla", komisyonOrani: 2.5, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 16 },
  { id: "papara", name: "Papara", komisyonOrani: 1.5, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 17 },
  { id: "cuzdan", name: "Cuzdan", komisyonOrani: 0, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 18 },
  { id: "acik-hesap", name: "Acik Hesap", komisyonOrani: 0, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 19 },
  { id: "fis-cek", name: "Fis/Cek", komisyonOrani: 0, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 20 },
  { id: "garanti-pay", name: "Garanti Pay", komisyonOrani: 2.2, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 21 },
  { id: "qr-odeme", name: "QR Odeme", komisyonOrani: 1.8, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 22 },
  { id: "puan", name: "Puan", komisyonOrani: 0, cekimKomisyonOrani: 0, baslangicBakiye: 0, sortOrder: 23 },
];

async function main() {
  const count = await prisma.paymentMethod.count();
  if (count === 0) {
    await prisma.paymentMethod.createMany({
      data: DEFAULT_PAYMENT_METHODS,
    });
    console.log(`Seed: ${DEFAULT_PAYMENT_METHODS.length} ödeme yöntemi eklendi.`);
  } else {
    console.log("Seed: payment_methods zaten dolu, atlandı.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
