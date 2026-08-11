import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ROLES } from "@/lib/roles";
import { ArrowLeft } from "lucide-react";

const Roles = () => {
  const navigate = useNavigate();

  return (
    <section id="roles" className="relative py-24">
      <div className="container">
        <div className="text-center mb-16">
          <div className="inline-block text-xs font-cyber tracking-[0.3em] text-primary mb-3">// THE ECOSYSTEM</div>
          <h2 className="text-4xl md:text-6xl font-black mb-4">
            بوابة موحّدة، <span className="text-gradient-primary">ستة أدوار</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            بغض النظر عن مكانك في السوق — لدينا لوحة قيادة عالية التقنية مصممة خصيصاً لك.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ROLES.map((role, i) => {
            const Icon = role.icon;
            const isGold = role.accent === "gold";
            return (
              <motion.button
                key={role.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                onClick={() => navigate(`/auth?mode=signup&role=${role.id}`)}
                className="group relative text-right glass rounded-2xl p-6 overflow-hidden hover:border-primary/50 transition-all duration-500 hover:-translate-y-1"
              >
                {/* Glow */}
                <div className={`absolute -top-20 -left-20 h-40 w-40 rounded-full blur-3xl opacity-0 group-hover:opacity-60 transition-opacity duration-700 ${isGold ? "bg-accent/40" : "bg-primary/40"}`} />

                {/* Number */}
                <div className="absolute top-4 left-4 font-cyber text-xs text-muted-foreground/50">
                  0{i + 1}
                </div>

                <div className={`relative inline-flex items-center justify-center h-14 w-14 rounded-xl mb-5 ${isGold ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"} group-hover:scale-110 transition-transform duration-500`}>
                  <Icon className="h-7 w-7" />
                  <div className={`absolute inset-0 rounded-xl border ${isGold ? "border-accent/30" : "border-primary/30"} group-hover:border-current transition-colors`} />
                </div>

                <h3 className="text-xl font-bold mb-2 text-foreground">{role.label}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-4">{role.desc}</p>

                <div className={`flex items-center gap-2 text-sm font-medium ${isGold ? "text-accent" : "text-primary"} opacity-0 group-hover:opacity-100 transition-opacity`}>
                  <span>ابدأ التسجيل</span>
                  <ArrowLeft className="h-4 w-4" />
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Roles;
