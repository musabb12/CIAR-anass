import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import ImageUploader from "@/components/common/ImageUploader";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Sparkles } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  storeId: string;
  product?: any | null; // null/undefined = create
  onSaved: () => void;
}

const empty = {
  name: "",
  description: "",
  brand: "",
  product_type: "",
  size: "",
  weight: "",
  dimensions: "",
  material: "",
  usage: "",
  sku: "",
  warranty: "",
  condition: "new",
  price: 0,
  discount_price: 0,
  stock: 10,
  is_active: true,
  is_featured: false,
  auto_hide_when_oos: true,
  category_id: "",
  tags: [] as string[],
  images: [] as string[],
  specs: {} as Record<string, string>,
};

const ProductDialog = ({ open, onClose, storeId, product, onSaved }: Props) => {
  const [form, setForm] = useState<any>(empty);
  const [tagInput, setTagInput] = useState("");
  const [specKey, setSpecKey] = useState("");
  const [specVal, setSpecVal] = useState("");
  const [categories, setCategories] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.from("categories").select("id, name_ar").then(({ data }) => setCategories(data ?? []));
  }, []);

  useEffect(() => {
    if (product) {
      setForm({
        ...empty,
        ...product,
        tags: product.tags ?? [],
        images: product.images ?? [],
        specs: product.specs ?? {},
        discount_price: product.discount_price ?? 0,
      });
    } else {
      setForm(empty);
    }
  }, [product, open]);

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

  const addTag = () => {
    const t = tagInput.trim();
    if (!t) return;
    if (!form.tags.includes(t)) set("tags", [...form.tags, t]);
    setTagInput("");
  };

  const addSpec = () => {
    if (!specKey.trim()) return;
    set("specs", { ...form.specs, [specKey.trim()]: specVal.trim() });
    setSpecKey("");
    setSpecVal("");
  };

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("الاسم مطلوب");
      return;
    }
    if (Number(form.price) <= 0) {
      toast.error("سعر صحيح مطلوب");
      return;
    }
    setSaving(true);
    const payload: any = {
      store_id: storeId,
      name: form.name,
      description: form.description || null,
      brand: form.brand || null,
      product_type: form.product_type || null,
      size: form.size || null,
      weight: form.weight || null,
      dimensions: form.dimensions || null,
      material: form.material || null,
      usage: form.usage || null,
      sku: form.sku || null,
      warranty: form.warranty || null,
      condition: form.condition,
      price: Number(form.price),
      discount_price: Number(form.discount_price) > 0 ? Number(form.discount_price) : null,
      stock: Number(form.stock),
      is_active: form.is_active,
      is_featured: form.is_featured,
      auto_hide_when_oos: form.auto_hide_when_oos,
      category_id: form.category_id || null,
      tags: form.tags,
      images: form.images,
      specs: form.specs,
    };

    const { error } = product?.id
      ? await supabase.from("products").update(payload).eq("id", product.id)
      : await supabase.from("products").insert(payload);

    setSaving(false);
    if (error) {
      toast.error("فشل الحفظ: " + error.message);
      return;
    }
    toast.success(product?.id ? "تم التحديث ✨" : "تمت الإضافة 🎉");
    onSaved();
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            {product?.id ? "تعديل المنتج" : "إضافة منتج جديد"}
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="basic">أساسي</TabsTrigger>
            <TabsTrigger value="details">تفاصيل</TabsTrigger>
            <TabsTrigger value="media">الصور</TabsTrigger>
            <TabsTrigger value="advanced">متقدم</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-3">
            <div>
              <Label>اسم المنتج *</Label>
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="مثال: قميص قطني فاخر" />
            </div>
            <div>
              <Label>الوصف</Label>
              <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="اكتب وصفاً جذاباً..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>السعر (ريال) *</Label>
                <Input type="number" value={form.price} onChange={(e) => set("price", e.target.value)} />
              </div>
              <div>
                <Label>سعر الخصم (اختياري)</Label>
                <Input type="number" value={form.discount_price} onChange={(e) => set("discount_price", e.target.value)} />
              </div>
              <div>
                <Label>الكمية المتوفرة</Label>
                <Input type="number" value={form.stock} onChange={(e) => set("stock", e.target.value)} />
              </div>
              <div>
                <Label>الفئة</Label>
                <Select value={form.category_id} onValueChange={(v) => set("category_id", v)}>
                  <SelectTrigger><SelectValue placeholder="اختر فئة" /></SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name_ar}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="details" className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div><Label>الماركة</Label><Input value={form.brand} onChange={(e) => set("brand", e.target.value)} /></div>
              <div><Label>النوع</Label><Input value={form.product_type} onChange={(e) => set("product_type", e.target.value)} placeholder="ملابس، إلكترونيات..." /></div>
              <div><Label>المقاس / القياس</Label><Input value={form.size} onChange={(e) => set("size", e.target.value)} placeholder="L, XL, 42..." /></div>
              <div><Label>الوزن</Label><Input value={form.weight} onChange={(e) => set("weight", e.target.value)} placeholder="500g, 2kg..." /></div>
              <div><Label>الأبعاد</Label><Input value={form.dimensions} onChange={(e) => set("dimensions", e.target.value)} placeholder="20×30×10 سم" /></div>
              <div><Label>الخامة</Label><Input value={form.material} onChange={(e) => set("material", e.target.value)} placeholder="قطن، جلد..." /></div>
            </div>
            <div>
              <Label>طريقة الاستعمال</Label>
              <Textarea rows={2} value={form.usage} onChange={(e) => set("usage", e.target.value)} placeholder="كيفية استخدام المنتج..." />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>الحالة</Label>
                <Select value={form.condition} onValueChange={(v) => set("condition", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">جديد</SelectItem>
                    <SelectItem value="used">مستعمل</SelectItem>
                    <SelectItem value="refurbished">مجدد</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div><Label>الضمان</Label><Input value={form.warranty} onChange={(e) => set("warranty", e.target.value)} placeholder="سنة، 6 أشهر..." /></div>
              <div className="col-span-2"><Label>SKU / كود المنتج</Label><Input value={form.sku} onChange={(e) => set("sku", e.target.value)} /></div>
            </div>
          </TabsContent>

          <TabsContent value="media">
            <ImageUploader
              value={form.images}
              onChange={(imgs) => set("images", imgs)}
              max={8}
              folder="products"
            />
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            <div>
              <Label>الوسوم (Tags)</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                  placeholder="أضف وسماً واضغط Enter"
                />
                <Button type="button" variant="outline" onClick={addTag}>إضافة</Button>
              </div>
              <div className="flex flex-wrap gap-1">
                {form.tags.map((t: string, i: number) => (
                  <span key={i} className="text-xs px-2 py-1 rounded bg-primary/10 text-primary cursor-pointer"
                    onClick={() => set("tags", form.tags.filter((_: any, j: number) => j !== i))}>
                    {t} ✕
                  </span>
                ))}
              </div>
            </div>

            <div>
              <Label>مواصفات إضافية</Label>
              <div className="grid grid-cols-[1fr_1fr_auto] gap-2 mb-2">
                <Input value={specKey} onChange={(e) => setSpecKey(e.target.value)} placeholder="المفتاح" />
                <Input value={specVal} onChange={(e) => setSpecVal(e.target.value)} placeholder="القيمة" />
                <Button type="button" variant="outline" onClick={addSpec}>+</Button>
              </div>
              <div className="space-y-1">
                {Object.entries(form.specs).map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs p-2 rounded bg-secondary/40">
                    <span><b>{k}:</b> {v as string}</span>
                    <button onClick={() => {
                      const s = { ...form.specs }; delete s[k]; set("specs", s);
                    }} className="text-destructive">✕</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-border/50">
              <div className="flex items-center justify-between">
                <Label className="text-sm">المنتج نشط وم€</Label>
                <Switch checked={form.is_active} onCheckedChange={(v) => set("is_active", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">منتج مميز ⭐</Label>
                <Switch checked={form.is_featured} onCheckedChange={(v) => set("is_featured", v)} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">إخفاء تلقائي عند نفاد المخزون</Label>
                <Switch checked={form.auto_hide_when_oos} onCheckedChange={(v) => set("auto_hide_when_oos", v)} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={saving}>إلغاء</Button>
          <Button variant="gold" onClick={save} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin ms-1" /> : <Save className="h-4 w-4 ms-1" />}
            {product?.id ? "حفظ التعديلات" : "نشر المنتج"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProductDialog;
