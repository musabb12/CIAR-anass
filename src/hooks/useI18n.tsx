import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "ar" | "en" | "fr" | "tr" | "ur" | "es";

export const LANGUAGES: { code: Lang; label: string; flag: string; dir: "rtl" | "ltr" }[] = [
  { code: "ar", label: "العربية", flag: "🇸🇦", dir: "rtl" },
  { code: "en", label: "English", flag: "🇬🇧", dir: "ltr" },
  { code: "fr", label: "Français", flag: "🇫🇷", dir: "ltr" },
  { code: "tr", label: "Türkçe", flag: "🇹🇷", dir: "ltr" },
  { code: "ur", label: "اردو", flag: "🇵🇰", dir: "rtl" },
  { code: "es", label: "Español", flag: "🇪🇸", dir: "ltr" },
];

const D = (ar: string, en: string, fr: string, tr: string, ur: string, es: string) => ({ ar, en, fr, tr, ur, es });

const DICT: Record<string, Record<Lang, string>> = {
  // generic
  language: D("اللغة","Language","Langue","Dil","زبان","Idioma"),
  search: D("بحث","Search","Rechercher","Ara","تلاش","Buscar"),
  cart: D("السلة","Cart","Panier","Sepet","ٹوکری","Carrito"),
  login: D("تسجيل دخول","Sign in","Connexion","Giriş","لاگ ان","Entrar"),
  logout: D("تسجيل خروج","Sign out","Déconnexion","Çıkış","لاگ آؤٹ","Salir"),
  home: D("الرئيسية","Home","Accueil","Ana sayfa","گھر","Inicio"),
  wallet: D("المحفظة","Wallet","Portefeuille","Cüzdan","والٹ","Cartera"),
  profile: D("الحساب","Profile","Profil","Profil","پروفائل","Perfil"),
  orders: D("الطلبات","Orders","Commandes","Siparişler","آرڈرز","Pedidos"),
  support: D("الدعم","Support","Support","Destek","سپورٹ","Soporte"),
  loading: D("جاري التحميل...","Loading...","Chargement...","Yükleniyor...","لوڈ ہو رہا ہے...","Cargando..."),
  save: D("حفظ","Save","Enregistrer","Kaydet","محفوظ کریں","Guardar"),
  optional: D("اختياري","optional","facultatif","isteğe bağlı","اختیاری","opcional"),
  notes: D("ملاحظات","Notes","Notes","Notlar","نوٹس","Notas"),
  none: D("بدون","None","Aucun","Yok","کوئی نہیں","Ninguno"),

  // product page
  product_details: D("تفاصيل المنتج","Product details","Détails du produit","Ürün detayları","پروڈکٹ کی تفصیلات","Detalles del producto"),
  available_colors: D("الألوان المتاحة","Available colors","Couleurs disponibles","Mevcut renkler","دستیاب رنگ","Colores disponibles"),
  sizes: D("القياسات","Sizes","Tailles","Bedenler","سائز","Tallas"),
  brand: D("المركة","Brand","Marque","Marka","برانڈ","Marca"),
  size: D("القياس","Size","Taille","Beden","سائز","Talla"),
  weight: D("الوزن","Weight","Poids","Ağırlık","وزن","Peso"),
  dimensions: D("الأبعاد","Dimensions","Dimensions","Boyutlar","طول و عرض","Dimensiones"),
  material: D("القماش / المادة","Material","Matière","Malzeme","مواد","Material"),
  usage: D("الاستخدام","Usage","Utilisation","Kullanım","استعمال","Uso"),
  condition: D("الحالة","Condition","État","Durum","حالت","Condición"),
  cond_new: D("جديد","New","Neuf","Yeni","نیا","Nuevo"),
  cond_used: D("مستعمل","Used","Occasion","Kullanılmış","استعمال شدہ","Usado"),
  warranty: D("الضمان","Warranty","Garantie","Garanti","وارنٹی","Garantía"),
  type: D("النوع","Type","Type","Tür","قسم","Tipo"),
  sku: D("رمز SKU","SKU","SKU","SKU","SKU","SKU"),
  category: D("الفئة","Category","Catégorie","Kategori","زمرہ","Categoría"),
  country: D("بلد الصنع","Country of origin","Pays d'origine","Menşe ülke","ملک کا اصل","País de origen"),
  manufacturer: D("الشركة المصنّعة","Manufacturer","Fabricant","Üretici","کارخانہ دار","Fabricante"),
  model: D("الموديل","Model","Modèle","Model","ماڈل","Modelo"),
  stock_available: D("الكمية المتوفرة","Available stock","Stock disponible","Mevcut stok","دستیاب اسٹاک","Stock disponible"),
  quantity: D("الكمية","Quantity","Quantité","Adet","مقدار","Cantidad"),
  available_qty: D("متاح","Available","Disponible","Mevcut","دستیاب","Disponible"),
  add_to_cart: D("أضف إلى السلة","Add to cart","Ajouter au panier","Sepete ekle","ٹوکری میں شامل کریں","Añadir al carrito"),
  fast_delivery: D("توصيل سريع","Fast delivery","Livraison rapide","Hızlı teslimat","تیز ترسیل","Entrega rápida"),
  quality_warranty: D("ضمان الجودة","Quality warranty","Garantie qualité","Kalite garantisi","معیار کی ضمانت","Garantía de calidad"),
  reviews_title: D("التقييمات والمراجعات","Ratings & reviews","Avis","Değerlendirmeler","ریٹنگ اور جائزے","Reseñas"),
  rate_product: D("قيّم هذا المنتج:","Rate this product:","Noter ce produit :","Bu ürünü değerlendir:","اس پروڈکٹ کو ریٹ کریں:","Califica este producto:"),
  share_experience: D("اكتب تجربتك...","Share your experience...","Partagez votre expérience...","Deneyiminizi paylaşın...","اپنا تجربہ شیئر کریں...","Comparte tu experiencia..."),
  send_review: D("إرسال التقييم","Send review","Envoyer l'avis","Değerlendirme gönder","جائزہ بھیجیں","Enviar reseña"),
  be_first_review: D("كن أول من يقيّم هذا المنتج","Be the first to review this product","Soyez le premier à donner votre avis","Bu ürünü ilk değerlendiren olun","سب سے پہلے جائزہ دیں","Sé el primero en opinar"),
  review_count: D("تقييم","reviews","avis","değerlendirme","جائزے","reseñas"),
  sold: D("مبيع","sold","vendus","satıldı","فروخت","vendidos"),
  sign_in_to_review: D("سجّل الدخول لكتابة تقييم","Sign in to write a review","Connectez-vous pour laisser un avis","Yorum yazmak için giriş yapın","جائزہ لکھنے کے لیے لاگ ان کریں","Inicia sesión para opinar"),
  review_send_failed: D("تعذر إرسال التقييم","Failed to send review","Échec de l'envoi","Gönderilemedi","بھیجنے میں ناکام","No se pudo enviar"),
  review_thanks: D("شكراً لتقييمك!","Thanks for your review!","Merci pour votre avis!","Değerlendirmeniz için teşekkürler!","شکریہ!","¡Gracias por tu opinión!"),

  // checkout
  checkout_title: D("إتمام الطلب","Checkout","Paiement","Ödeme","چیک آؤٹ","Pago"),
  delivery_address: D("عنوان التوصيل","Delivery address","Adresse de livraison","Teslimat adresi","ترسیل کا پتہ","Dirección de entrega"),
  address_default: D("عنوان","Address","Adresse","Adres","پتہ","Dirección"),
  add_new_address: D("+ إضافة عنوان جديد","+ Add new address","+ Ajouter une adresse","+ Yeni adres ekle","+ نیا پتہ شامل کریں","+ Añadir dirección"),
  full_name: D("الاسم الكامل","Full name","Nom complet","Tam ad","پورا نام","Nombre completo"),
  phone: D("رقم الجوال","Phone","Téléphone","Telefon","فون","Teléfono"),
  city_req: D("المدينة *","City *","Ville *","Şehir *","شہر *","Ciudad *"),
  district: D("الحي","District","Quartier","Mahalle","علاقہ","Distrito"),
  street: D("الشارع وعلامة مميزة","Street & landmark","Rue & repère","Sokak & nirengi","سڑک","Calle y referencia"),
  save_address: D("حفظ العنوان","Save address","Enregistrer l'adresse","Adresi kaydet","پتہ محفوظ کریں","Guardar dirección"),
  address_added: D("أُضيف العنوان","Address added","Adresse ajoutée","Adres eklendi","پتہ شامل ہو گیا","Dirección añadida"),
  address_save_failed: D("تعذر حفظ العنوان","Failed to save address","Échec de l'enregistrement","Adres kaydedilemedi","پتہ محفوظ نہیں ہوا","No se pudo guardar"),
  complete_address: D("أكمل بيانات العنوان","Complete the address","Complétez l'adresse","Adresi tamamlayın","پتہ مکمل کریں","Completa la dirección"),
  pick_address: D("اختر عنوان التوصيل","Select a delivery address","Choisissez une adresse","Teslimat adresi seçin","پتہ منتخب کریں","Selecciona dirección"),
  cart_empty: D("السلة فارغة","Cart is empty","Panier vide","Sepet boş","ٹوکری خالی ہے","Carrito vacío"),

  global_pay: D("بوابة الدفع العالمية","Global payment gateway","Passerelle de paiement","Küresel ödeme","عالمی ادائیگی","Pasarela global"),
  global_pay_secure: D("الدفع العالمي الآمن","Secure global payment","Paiement sécurisé","Güvenli küresel ödeme","محفوظ عالمی ادائیگی","Pago global seguro"),
  global_pay_desc: D(
    "ادفع بأمان عبر بوابة عالمية موحّدة بالعملة المحلية أو الدولية. مدعومة بالتشفير الكامل وضمان استرداد المبلغ.",
    "Pay securely through a unified global gateway in local or international currency. Fully encrypted with refund guarantee.",
    "Payez en toute sécurité via une passerelle mondiale unifiée. Chiffrement total et garantie de remboursement.",
    "Yerel veya uluslararası para birimiyle birleşik küresel bir ağ geçidi üzerinden güvenli ödeme. Tam şifreleme ve iade garantisi.",
    "مقامی یا بین الاقوامی کرنسی میں محفوظ عالمی گیٹ وے کے ذریعے ادائیگی۔",
    "Paga de forma segura mediante una pasarela global unificada en moneda local o internacional."
  ),
  stripe_enabled: D("Stripe مُفعّل ✓","Stripe enabled ✓","Stripe activé ✓","Stripe aktif ✓","Stripe فعال ✓","Stripe activado ✓"),
  paypal_enabled: D("PayPal مُفعّل ✓","PayPal enabled ✓","PayPal activé ✓","PayPal aktif ✓","PayPal فعال ✓","PayPal activado ✓"),
  sandbox_mode: D(
    "وضع تجريبي — يفعّل المسؤول المفاتيح من لوحة التكاملات",
    "Sandbox mode — admin enables keys from integrations panel",
    "Mode sandbox — l'admin active les clés",
    "Sandbox modu — yönetici anahtarları etkinleştirir",
    "سینڈ باکس موڈ",
    "Modo sandbox — el admin activa las claves"
  ),
  extra_notes: D("ملاحظات إضافية (اختياري)","Additional notes (optional)","Notes supplémentaires (facultatif)","Ek notlar (isteğe bağlı)","اضافی نوٹس (اختیاری)","Notas adicionales (opcional)"),

  fawela_title: D("الفوّالة — دعم بنزين الطيار","Fawela — driver fuel tip","Fawela — pourboire carburant","Fawela — kurye yakıt bahşişi","ڈرائیور ٹپ","Propina de combustible"),
  fawela_desc: D(
    "إكرامية اختيارية تذهب 100% للموصِّل لدعم تكاليف الوقود ❤️",
    "Optional tip that goes 100% to the driver to support fuel costs ❤️",
    "Pourboire optionnel reversé à 100% au livreur ❤️",
    "Tamamı kuryeye giden isteğe bağlı bahşiş ❤️",
    "اختیاری ٹپ جو ڈرائیور کو جاتی ہے ❤️",
    "Propina opcional 100% para el repartidor ❤️"
  ),

  smart_pricing: D("محرك التسعير الذكي","Smart pricing engine","Tarification intelligente","Akıllı fiyatlandırma","اسمارٹ قیمت","Tarificación inteligente"),
  subtotal_base: D("السعر الأساس","Subtotal","Sous-total","Ara toplam","ذیلی کل","Subtotal"),
  smart_shipping: D("التوصيل الذكي","Smart shipping","Livraison intelligente","Akıllı kargo","اسمارٹ ترسیل","Envío inteligente"),
  free_label: D("مجاني ✨","Free ✨","Gratuit ✨","Ücretsiz ✨","مفت ✨","Gratis ✨"),
  service_fee: D("رسوم خدمة المارد","Service fee","Frais de service","Hizmet bedeli","سروس فیس","Tarifa de servicio"),
  pilot_tip: D("فوّالة الطيار","Driver tip","Pourboire livreur","Kurye bahşişi","ڈرائیور ٹپ","Propina"),
  total: D("الإجمالي","Total","Total","Toplam","کل","Total"),
  secure_pay_badge: D(
    "دفع عالمي آمن — معاملة مشفّرة بالكامل عبر بوابة الدفع الموحّدة.",
    "Secure global payment — fully encrypted via the unified gateway.",
    "Paiement mondial sécurisé — entièrement chiffré.",
    "Güvenli küresel ödeme — tamamen şifreli.",
    "محفوظ عالمی ادائیگی — مکمل خفیہ کاری۔",
    "Pago global seguro — totalmente cifrado."
  ),
  confirming: D("جاري الإنشاء...","Creating...","Création...","Oluşturuluyor...","بنایا جا رہا ہے...","Creando..."),
  confirm_order: D("تأكيد الطلب ✨","Confirm order ✨","Confirmer ✨","Siparişi onayla ✨","آرڈر کی تصدیق ✨","Confirmar pedido ✨"),
  order_created: D("تم إنشاء طلبك بنجاح ✨","Order created successfully ✨","Commande créée ✨","Sipariş oluşturuldu ✨","آرڈر بن گیا ✨","Pedido creado ✨"),
  order_failed: D("تعذر إنشاء الطلب","Failed to create order","Échec de la commande","Sipariş oluşturulamadı","آرڈر ناکام","No se pudo crear"),
  new_order_title: D("🧞 طلب جديد","🧞 New order","🧞 Nouvelle commande","🧞 Yeni sipariş","🧞 نیا آرڈر","🧞 Nuevo pedido"),
  new_order_msg: D("أُنشئ طلبك","Your order was created","Votre commande a été créée","Siparişiniz oluşturuldu","آپ کا آرڈر بن گیا","Tu pedido se creó"),
};

interface Ctx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
  dir: "rtl" | "ltr";
}

const I18nContext = createContext<Ctx>({ lang: "ar", setLang: () => {}, t: (k) => k, dir: "rtl" });

export const I18nProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => (localStorage.getItem("app_lang") as Lang) || "ar");
  const dir = LANGUAGES.find((l) => l.code === lang)?.dir ?? "rtl";

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = (l: Lang) => {
    localStorage.setItem("app_lang", l);
    setLangState(l);
  };

  const t = (key: string) => DICT[key]?.[lang] ?? DICT[key]?.ar ?? key;

  return <I18nContext.Provider value={{ lang, setLang, t, dir }}>{children}</I18nContext.Provider>;
};

export const useI18n = () => useContext(I18nContext);
