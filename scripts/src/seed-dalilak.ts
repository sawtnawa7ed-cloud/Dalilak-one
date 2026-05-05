import { db, pool } from "@workspace/db";
import {
  governoratesTable, citiesTable, areasTable, usersTable,
  placesTable, evaluationsTable
} from "@workspace/db";
import crypto from "crypto";

function hash(pw: string) {
  return crypto.createHash("sha256").update(pw + "dalilak_salt").digest("hex");
}

async function main() {
  console.log("🌱 Seeding dalilak database...");

  // Governorates
  const govs = await db.insert(governoratesTable).values([
    { name: "بيروت", nameEn: "Beirut" },
    { name: "جبل لبنان", nameEn: "Mount Lebanon" },
    { name: "الشمال", nameEn: "North Lebanon" },
    { name: "البقاع", nameEn: "Bekaa" },
    { name: "الجنوب", nameEn: "South Lebanon" },
    { name: "النبطية", nameEn: "Nabatieh" },
    { name: "عكار", nameEn: "Akkar" },
    { name: "بعلبك الهرمل", nameEn: "Baalbek-Hermel" },
  ]).returning();

  console.log(`✅ ${govs.length} governorates`);

  const beirut = govs.find(g => g.nameEn === "Beirut")!;
  const mountLeb = govs.find(g => g.nameEn === "Mount Lebanon")!;
  const north = govs.find(g => g.nameEn === "North Lebanon")!;
  const bekaa = govs.find(g => g.nameEn === "Bekaa")!;
  const south = govs.find(g => g.nameEn === "South Lebanon")!;
  const nabatieh = govs.find(g => g.nameEn === "Nabatieh")!;

  // Cities
  const cities = await db.insert(citiesTable).values([
    // Beirut
    { name: "بيروت", nameEn: "Beirut City", governorateId: beirut.id },
    // Mount Lebanon
    { name: "بيت مري", nameEn: "Beit Mery", governorateId: mountLeb.id },
    { name: "جونية", nameEn: "Jounieh", governorateId: mountLeb.id },
    { name: "زحلة", nameEn: "Zahle", governorateId: mountLeb.id },
    { name: "جبيل", nameEn: "Byblos", governorateId: mountLeb.id },
    { name: "الدامور", nameEn: "Damour", governorateId: mountLeb.id },
    { name: "بعبدا", nameEn: "Baabda", governorateId: mountLeb.id },
    { name: "عاليه", nameEn: "Aley", governorateId: mountLeb.id },
    { name: "المتن", nameEn: "Metn", governorateId: mountLeb.id },
    { name: "كسروان", nameEn: "Keserwan", governorateId: mountLeb.id },
    // North
    { name: "طرابلس", nameEn: "Tripoli", governorateId: north.id },
    { name: "زغرتا", nameEn: "Zgharta", governorateId: north.id },
    { name: "بشري", nameEn: "Bcharre", governorateId: north.id },
    { name: "البترون", nameEn: "Batroun", governorateId: north.id },
    { name: "الكورة", nameEn: "Koura", governorateId: north.id },
    // Bekaa
    { name: "بعلبك", nameEn: "Baalbek", governorateId: bekaa.id },
    { name: "زحلة البقاع", nameEn: "Zahle Bekaa", governorateId: bekaa.id },
    { name: "رياق", nameEn: "Riyaq", governorateId: bekaa.id },
    // South
    { name: "صور", nameEn: "Tyre", governorateId: south.id },
    { name: "صيدا", nameEn: "Sidon", governorateId: south.id },
    { name: "النبطية", nameEn: "Nabatieh City", governorateId: nabatieh.id },
    { name: "بنت جبيل", nameEn: "Bint Jbeil", governorateId: nabatieh.id },
  ]).returning();

  console.log(`✅ ${cities.length} cities`);

  const beirutCity = cities.find(c => c.nameEn === "Beirut City")!;
  const tripoli = cities.find(c => c.nameEn === "Tripoli")!;
  const jounieh = cities.find(c => c.nameEn === "Jounieh")!;
  const sidon = cities.find(c => c.nameEn === "Sidon")!;

  // Areas
  const areas = await db.insert(areasTable).values([
    // Beirut areas
    { name: "الأشرفية", cityId: beirutCity.id },
    { name: "الحمرا", cityId: beirutCity.id },
    { name: "الروشة", cityId: beirutCity.id },
    { name: "الدورة", cityId: beirutCity.id },
    { name: "الكولا", cityId: beirutCity.id },
    { name: "برج حمود", cityId: beirutCity.id },
    { name: "المزرعة", cityId: beirutCity.id },
    { name: "الرملة البيضا", cityId: beirutCity.id },
    { name: "وسط المدينة", cityId: beirutCity.id },
    { name: "المار مخايل", cityId: beirutCity.id },
    // Tripoli areas
    { name: "الميناء", cityId: tripoli.id },
    { name: "القبة", cityId: tripoli.id },
    { name: "التبانة", cityId: tripoli.id },
    { name: "أبو سمرا", cityId: tripoli.id },
    // Jounieh areas
    { name: "الجديدة", cityId: jounieh.id },
    { name: "المعمرة", cityId: jounieh.id },
    // Sidon areas
    { name: "المدينة القديمة", cityId: sidon.id },
    { name: "الأوزاعي", cityId: sidon.id },
  ]).returning();

  console.log(`✅ ${areas.length} areas`);

  // Users
  const users = await db.insert(usersTable).values([
    { name: "مجدي", email: "majdi@dalilak.lb", passwordHash: hash("dalilak2o26"), role: "admin", status: "active" },
    { name: "جمعية الإمكانية", email: "dal-ab3x7y@expert.dalilak.lb", passwordHash: hash("DAL-AB3X7Y"), role: "expert", status: "approved", accessCode: "DAL-AB3X7Y" },
    { name: "علي زائر", email: "ali@dalilak.lb", passwordHash: hash("visitor123"), role: "visitor", status: "active" },
  ]).returning();

  console.log(`✅ ${users.length} users`);

  const admin = users.find(u => u.role === "admin")!;
  const expert1 = users.find(u => u.role === "expert")!;
  const expert2 = expert1;

  const ashrafieh = areas.find(a => a.name === "الأشرفية")!;
  const hamra = areas.find(a => a.name === "الحمرا")!;
  const downtownBeirut = areas.find(a => a.name === "وسط المدينة")!;

  // Places
  const places = await db.insert(placesTable).values([
    {
      name: "مستشفى الأمريكية الجامعية - AUB Medical Center",
      category: "مستشفى",
      address: "شارع رياض الصلح، الحمرا، بيروت",
      lat: 33.8888, lng: 35.4784,
      phone: "01-350000",
      description: "مستشفى جامعي بمرافق حديثة، ويُعدّ من أفضل المستشفيات في لبنان من حيث إمكانية الوصول",
      governorateId: beirut.id, cityId: beirutCity.id, areaId: hamra.id,
      addedById: expert1.id, isVerified: true,
      hasRamp: true, hasElevator: true, hasAccessibleBathroom: true, hasAccessibleParking: true,
    },
    {
      name: "مطار رفيق الحريري الدولي",
      category: "مطار",
      address: "طريق المطار، بيروت",
      lat: 33.8209, lng: 35.4884,
      phone: "01-628000",
      description: "المطار الرئيسي للبنان، يوفر خدمات متكاملة لذوي الاحتياجات الخاصة",
      governorateId: beirut.id, cityId: beirutCity.id, areaId: null,
      addedById: expert1.id, isVerified: true,
      hasRamp: true, hasElevator: true, hasAccessibleBathroom: true, hasAccessibleParking: true,
    },
    {
      name: "مركز بيروت للتسوق - ABC Achrafieh",
      category: "مركز تسوق",
      address: "شارع الأشرفية الرئيسي، بيروت",
      lat: 33.8887, lng: 35.5135,
      phone: "01-217600",
      description: "مركز تسوق ABC في الأشرفية، مزود بمنحدرات وإعاقات مناسبة",
      governorateId: beirut.id, cityId: beirutCity.id, areaId: ashrafieh.id,
      addedById: expert2.id, isVerified: true,
      hasRamp: true, hasElevator: true, hasAccessibleBathroom: true, hasAccessibleParking: true,
    },
    {
      name: "الجامعة الأمريكية في بيروت - AUB",
      category: "جامعة",
      address: "شارع بلس، الحمرا، بيروت",
      lat: 33.8998, lng: 35.4785,
      phone: "01-350000",
      description: "إحدى أعرق الجامعات في الشرق الأوسط، تتضمن ممرات مخصصة وكراسي متحركة",
      governorateId: beirut.id, cityId: beirutCity.id, areaId: hamra.id,
      addedById: admin.id, isVerified: true,
      hasRamp: true, hasElevator: true, hasAccessibleBathroom: false, hasAccessibleParking: true,
    },
    {
      name: "ساحة النجمة - وسط بيروت",
      category: "حديقة عامة",
      address: "وسط بيروت التجاري",
      lat: 33.8887, lng: 35.5028,
      phone: null,
      description: "ساحة تاريخية تم تطويرها بعد إعادة الإعمار، مع ممرات مبلطة للكراسي المتحركة",
      governorateId: beirut.id, cityId: beirutCity.id, areaId: downtownBeirut.id,
      addedById: expert1.id, isVerified: false,
      hasRamp: true, hasElevator: false, hasAccessibleBathroom: false, hasAccessibleParking: false,
    },
    {
      name: "مركز إعادة التأهيل الوطني",
      category: "مركز صحي",
      address: "قصقص، بيروت",
      lat: 33.8623, lng: 35.5045,
      phone: "01-615000",
      description: "مركز متخصص في إعادة التأهيل الجسدي، مجهز بالكامل لخدمة ذوي الإعاقة الحركية",
      governorateId: beirut.id, cityId: beirutCity.id, areaId: null,
      addedById: expert2.id, isVerified: true,
      hasRamp: true, hasElevator: true, hasAccessibleBathroom: true, hasAccessibleParking: true,
    },
    {
      name: "متحف بيروت الوطني",
      category: "متحف",
      address: "شارع دمشق، بيروت",
      lat: 33.8731, lng: 35.5144,
      phone: "01-426703",
      description: "يضم مقتنيات أثرية لبنانية نادرة، مع مداخل خاصة لذوي الاحتياجات الخاصة",
      governorateId: beirut.id, cityId: beirutCity.id, areaId: null,
      addedById: expert1.id, isVerified: true,
      hasRamp: true, hasElevator: false, hasAccessibleBathroom: true, hasAccessibleParking: true,
    },
    {
      name: "مستشفى طرابلس الحكومي",
      category: "مستشفى",
      address: "القبة، طرابلس",
      lat: 34.4432, lng: 35.8339,
      phone: "06-630000",
      description: "المستشفى الحكومي الرئيسي في طرابلس",
      governorateId: north.id, cityId: tripoli.id, areaId: areas.find(a => a.name === "القبة")?.id ?? null,
      addedById: admin.id, isVerified: false,
      hasRamp: false, hasElevator: false, hasAccessibleBathroom: false, hasAccessibleParking: true,
    },
    {
      name: "مجمع أبراج جونية التجاري",
      category: "مركز تسوق",
      address: "الجديدة، جونية",
      lat: 33.9788, lng: 35.6157,
      phone: "09-910000",
      description: "مجمع تجاري على ساحل جونية",
      governorateId: mountLeb.id, cityId: jounieh.id, areaId: areas.find(a => a.name === "الجديدة")?.id ?? null,
      addedById: expert2.id, isVerified: false,
      hasRamp: true, hasElevator: true, hasAccessibleBathroom: false, hasAccessibleParking: true,
    },
    {
      name: "مستشفى صيدا الحكومي",
      category: "مستشفى",
      address: "المدينة القديمة، صيدا",
      lat: 33.5632, lng: 35.3690,
      phone: "07-722000",
      description: "مستشفى الجنوب الحكومي الرئيسي",
      governorateId: south.id, cityId: sidon.id, areaId: areas.find(a => a.name === "المدينة القديمة")?.id ?? null,
      addedById: admin.id, isVerified: false,
      hasRamp: false, hasElevator: false, hasAccessibleBathroom: false, hasAccessibleParking: false,
    },
    {
      name: "ملعب الحمدان - صيدا",
      category: "ملعب رياضي",
      address: "صيدا",
      lat: 33.5609, lng: 35.3784,
      phone: null,
      description: "ملعب رياضي بطاقة استيعابية كبيرة",
      governorateId: south.id, cityId: sidon.id, areaId: null,
      addedById: expert1.id, isVerified: false,
      hasRamp: false, hasElevator: false, hasAccessibleBathroom: false, hasAccessibleParking: true,
    },
    {
      name: "قلعة بعلبك الأثرية",
      category: "موقع سياحي",
      address: "بعلبك، البقاع",
      lat: 34.0043, lng: 36.2117,
      phone: "08-370080",
      description: "إحدى أبرز المعالم الأثرية في العالم والأكثر جذباً في لبنان",
      governorateId: bekaa.id, cityId: cities.find(c => c.nameEn === "Baalbek")!.id, areaId: null,
      addedById: admin.id, isVerified: false,
      hasRamp: false, hasElevator: false, hasAccessibleBathroom: false, hasAccessibleParking: true,
    },
    {
      name: "مطعم كمال - الروشة",
      category: "مطعم",
      address: "كورنيش الروشة، بيروت",
      lat: 33.8967, lng: 35.4765,
      phone: "01-866000",
      description: "مطعم مطل على البحر مع مصعد لأصحاب الكراسي المتحركة",
      governorateId: beirut.id, cityId: beirutCity.id, areaId: areas.find(a => a.name === "الروشة")?.id ?? null,
      addedById: expert2.id, isVerified: true,
      hasRamp: true, hasElevator: true, hasAccessibleBathroom: true, hasAccessibleParking: false,
    },
    {
      name: "بنك لبنان والمهجر - فرع الحمرا",
      category: "بنك",
      address: "شارع الحمرا الرئيسي، بيروت",
      lat: 33.8961, lng: 35.4808,
      phone: "01-346760",
      description: "فرع بنك BLOM في الحمرا مع منحدر للدخول",
      governorateId: beirut.id, cityId: beirutCity.id, areaId: hamra.id,
      addedById: expert1.id, isVerified: true,
      hasRamp: true, hasElevator: false, hasAccessibleBathroom: false, hasAccessibleParking: false,
    },
    {
      name: "فندق لو غراي بيروت",
      category: "فندق",
      address: "وسط بيروت",
      lat: 33.8912, lng: 35.5017,
      phone: "01-971111",
      description: "فندق خمس نجوم بخدمات كاملة لذوي الاحتياجات الخاصة",
      governorateId: beirut.id, cityId: beirutCity.id, areaId: downtownBeirut.id,
      addedById: expert2.id, isVerified: true,
      hasRamp: true, hasElevator: true, hasAccessibleBathroom: true, hasAccessibleParking: true,
    },
  ]).returning();

  console.log(`✅ ${places.length} places seeded`);

  // Evaluations for verified places
  const evalData = [
    { placeId: places[0].id, expertId: expert1.id, hasRamp: true, hasElevator: true, hasAccessibleBathroom: true, hasAccessibleParking: true, rating: 5, notes: "مرافق ممتازة وكاملة" },
    { placeId: places[0].id, expertId: expert2.id, hasRamp: true, hasElevator: true, hasAccessibleBathroom: true, hasAccessibleParking: true, rating: 4, notes: "مناسب جداً لأصحاب الكراسي المتحركة" },
    { placeId: places[1].id, expertId: expert1.id, hasRamp: true, hasElevator: true, hasAccessibleBathroom: true, hasAccessibleParking: true, rating: 4, notes: "يوفر المطار خدمة الكراسي المتحركة عند الطلب" },
    { placeId: places[2].id, expertId: expert2.id, hasRamp: true, hasElevator: true, hasAccessibleBathroom: true, hasAccessibleParking: true, rating: 5, notes: "من أفضل المراكز التجارية لذوي الاحتياجات الخاصة" },
    { placeId: places[3].id, expertId: expert1.id, hasRamp: true, hasElevator: true, hasAccessibleBathroom: false, hasAccessibleParking: true, rating: 3, notes: "يحتاج الحرم الجامعي إلى تحسينات في الممرات" },
    { placeId: places[5].id, expertId: expert2.id, hasRamp: true, hasElevator: true, hasAccessibleBathroom: true, hasAccessibleParking: true, rating: 5, notes: "مجهز بالكامل كمركز متخصص" },
    { placeId: places[6].id, expertId: expert1.id, hasRamp: true, hasElevator: false, hasAccessibleBathroom: true, hasAccessibleParking: true, rating: 4, notes: "لا يوجد مصعد لكن الطابق الأرضي متاح" },
    { placeId: places[12].id, expertId: expert2.id, hasRamp: true, hasElevator: true, hasAccessibleBathroom: true, hasAccessibleParking: false, rating: 4, notes: "مطعم رائع مع وصول جيد" },
    { placeId: places[13].id, expertId: expert1.id, hasRamp: true, hasElevator: false, hasAccessibleBathroom: false, hasAccessibleParking: false, rating: 3, notes: "منحدر مناسب لكن يفتقر لمرافق أخرى" },
    { placeId: places[14].id, expertId: expert2.id, hasRamp: true, hasElevator: true, hasAccessibleBathroom: true, hasAccessibleParking: true, rating: 5, notes: "خدمة استثنائية لذوي الاحتياجات الخاصة" },
  ];

  await db.insert(evaluationsTable).values(evalData);
  console.log(`✅ ${evalData.length} evaluations seeded`);

  console.log("\n✅ Seeding complete!");
  console.log("\n📋 Credentials:");
  console.log("  Admin:   majdi@dalilak.lb / dalilak2o26");
  console.log("  Expert:  code DAL-AB3X7Y  (via code-login)");
  console.log("  Visitor: ali@dalilak.lb   / visitor123");
}

main().catch(console.error).finally(() => pool.end());
