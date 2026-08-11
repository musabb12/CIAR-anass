import { Hexagon } from "lucide-react";

const Footer = () => (
  <footer className="border-t border-border/50 py-12 mt-12">
    <div className="container">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
        <div className="col-span-2">
          <div className="flex items-center gap-2 mb-3">
            <Hexagon className="h-7 w-7 text-primary" strokeWidth={1.5} />
            <div>
              <div className="font-cyber font-bold text-gradient-primary">مارد التفوق</div>
              <div className="text-[10px] text-muted-foreground tracking-widest">€قك إلى عالم التسوق</div>
            </div>
          </div>
          <p className="text-sm text-muted-foreground max-w-md leading-relaxed">
            تسوّق من مكانك مع مارد التفوق — منظومة متكاملة للتجارة، التوصيل، الوظائف وB2B في ألمانيا. معنا مستقبلك أفضل.
          </p>
        </div>
        <div>
          <h4 className="font-bold mb-3 text-sm">المنصة</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#roles" className="hover:text-primary transition-colors">الأدوار</a></li>
            <li><a href="#features" className="hover:text-primary transition-colors">المنظومة</a></li>
            <li><a href="#pricing" className="hover:text-primary transition-colors">التسعير</a></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-3 text-sm">الموارد</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#jobs" className="hover:text-primary transition-colors">الوظائف</a></li>
            <li><a href="#b2b" className="hover:text-primary transition-colors">B2B</a></li>
            <li><a href="/auth" className="hover:text-primary transition-colors">دخول</a></li>
          </ul>
        </div>
      </div>
      <div className="pt-6 border-t border-border/50 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div>© {new Date().getFullYear()} مارد التفوق. كل الحقوق محفوظة.</div>
        <div className="font-cyber tracking-widest">v1.0 // معنا مستقبلك أفضل</div>
      </div>
    </div>
  </footer>
);

export default Footer;
