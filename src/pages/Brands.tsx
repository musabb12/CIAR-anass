import PageHeader from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { motion } from "framer-motion";

const brands = ["Samsung", "Apple", "Huawei", "Xiaomi", "Sony", "LG", "Adidas", "Nike", "Puma", "HP", "Dell", "Lenovo"];

const Brands = () => (
  <div>
    <PageHeader badge="TOP BRANDS" title="العلامات التجارية" subtitle="تسوّق من أشهر الماركات العالمية والمحلية" />
    <div className="container py-10">
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {brands.map((b, i) => (
          <motion.div key={b} initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ delay: i * 0.04 }}>
            <Card className="p-6 text-center hover:border-primary/40 transition cursor-pointer group">
              <Building2 className="mx-auto h-8 w-8 text-primary mb-2 group-hover:text-accent transition-colors" />
              <div className="font-cyber text-sm font-bold">{b}</div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  </div>
);
export default Brands;
