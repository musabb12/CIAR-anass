
-- ENUMS
CREATE TYPE public.order_status AS ENUM ('pending','confirmed','preparing','shipping','delivered','cancelled','returned');
CREATE TYPE public.payment_method AS ENUM ('wallet','cod','bank_transfer');
CREATE TYPE public.payment_status AS ENUM ('pending','paid','failed','refunded');
CREATE TYPE public.transaction_type AS ENUM ('deposit','withdraw','purchase','refund','commission','salary');
CREATE TYPE public.transaction_status AS ENUM ('pending','completed','failed');
CREATE TYPE public.job_type AS ENUM ('full_time','part_time','contract','remote','internship');
CREATE TYPE public.application_status AS ENUM ('pending','reviewing','interview','accepted','rejected');
CREATE TYPE public.notification_type AS ENUM ('order','wallet','job','system','promo');

-- CATEGORIES
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, name_ar TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
  icon TEXT, parent_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
  display_order INT DEFAULT 0, created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Categories public" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins manage categories" ON public.categories FOR ALL USING (public.has_role(auth.uid(),'admin'));

-- STORES
CREATE TABLE public.stores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL, name TEXT NOT NULL, slug TEXT UNIQUE NOT NULL,
  description TEXT, logo_url TEXT, cover_url TEXT, city TEXT, phone TEXT,
  rating NUMERIC(3,2) DEFAULT 0, total_sales INT DEFAULT 0,
  is_verified BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true,
  theme_color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Stores public" ON public.stores FOR SELECT USING (true);
CREATE POLICY "Owner inserts store" ON public.stores FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "Owner updates store" ON public.stores FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "Owner deletes store" ON public.stores FOR DELETE USING (auth.uid() = owner_id);
CREATE TRIGGER trg_stores_upd BEFORE UPDATE ON public.stores FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID REFERENCES public.stores(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL, description TEXT,
  price NUMERIC(12,2) NOT NULL, discount_price NUMERIC(12,2),
  stock INT NOT NULL DEFAULT 0, images TEXT[] DEFAULT '{}',
  rating NUMERIC(3,2) DEFAULT 0, reviews_count INT DEFAULT 0, sales_count INT DEFAULT 0,
  is_featured BOOLEAN DEFAULT false, is_active BOOLEAN DEFAULT true,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Products public" ON public.products FOR SELECT USING (true);
CREATE POLICY "Store owner manages products" ON public.products FOR ALL
  USING (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.stores s WHERE s.id = store_id AND s.owner_id = auth.uid()));
CREATE TRIGGER trg_products_upd BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_products_store ON public.products(store_id);
CREATE INDEX idx_products_category ON public.products(category_id);

-- ADDRESSES
CREATE TABLE public.addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, label TEXT, full_name TEXT, phone TEXT,
  city TEXT NOT NULL, district TEXT, street TEXT, notes TEXT,
  lat NUMERIC, lng NUMERIC, is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage addresses" ON public.addresses FOR ALL
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- CART
CREATE TABLE public.cart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  quantity INT NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage cart" ON public.cart_items FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- WISHLIST
CREATE TABLE public.wishlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);
ALTER TABLE public.wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage wishlist" ON public.wishlists FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ORDERS (no cross-table policies yet)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT UNIQUE NOT NULL DEFAULT ('ON-' || to_char(now(),'YYMMDD') || '-' || lpad((floor(random()*100000))::text,5,'0')),
  customer_id UUID NOT NULL, pilot_id UUID,
  address_id UUID REFERENCES public.addresses(id),
  subtotal NUMERIC(12,2) NOT NULL DEFAULT 0,
  shipping_fee NUMERIC(12,2) NOT NULL DEFAULT 0,
  total NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.order_status NOT NULL DEFAULT 'pending',
  payment_method public.payment_method NOT NULL DEFAULT 'cod',
  payment_status public.payment_status NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_orders_upd BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ORDER ITEMS
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id),
  product_name TEXT NOT NULL, product_image TEXT,
  unit_price NUMERIC(12,2) NOT NULL, quantity INT NOT NULL,
  subtotal NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- ORDERS POLICIES (now order_items exists)
CREATE POLICY "Customer sees own orders" ON public.orders FOR SELECT USING (auth.uid() = customer_id);
CREATE POLICY "Pilot sees assigned orders" ON public.orders FOR SELECT USING (auth.uid() = pilot_id);
CREATE POLICY "Seller sees store orders" ON public.orders FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.order_items oi
    JOIN public.products p ON p.id = oi.product_id
    JOIN public.stores s ON s.id = p.store_id
    WHERE oi.order_id = orders.id AND s.owner_id = auth.uid()
  )
);
CREATE POLICY "Admins see all orders" ON public.orders FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Customer creates order" ON public.orders FOR INSERT WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "Customer updates own order" ON public.orders FOR UPDATE USING (auth.uid() = customer_id);
CREATE POLICY "Pilot updates assigned" ON public.orders FOR UPDATE USING (auth.uid() = pilot_id);

-- ORDER ITEMS POLICIES
CREATE POLICY "Order items follow access" ON public.order_items FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND (
    o.customer_id = auth.uid() OR o.pilot_id = auth.uid() OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.products p JOIN public.stores s ON s.id = p.store_id WHERE p.id = order_items.product_id AND s.owner_id = auth.uid())
  ))
);
CREATE POLICY "Customer inserts order items" ON public.order_items FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.customer_id = auth.uid())
);

-- REVIEWS
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, rating INT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT, created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reviews public" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "Users create reviews" ON public.reviews FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update reviews" ON public.reviews FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users delete reviews" ON public.reviews FOR DELETE USING (auth.uid() = user_id);

-- WALLETS
CREATE TABLE public.wallets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  balance NUMERIC(14,2) NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'YER',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(), updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see wallet" ON public.wallets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins see all wallets" ON public.wallets FOR SELECT USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_wallets_upd BEFORE UPDATE ON public.wallets FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- TRANSACTIONS
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  type public.transaction_type NOT NULL,
  amount NUMERIC(14,2) NOT NULL,
  status public.transaction_status NOT NULL DEFAULT 'pending',
  reference TEXT, description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins see all transactions" ON public.transactions FOR SELECT USING (public.has_role(auth.uid(),'admin'));

-- JOBS
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  posted_by UUID NOT NULL, company_name TEXT NOT NULL,
  title TEXT NOT NULL, description TEXT, requirements TEXT,
  city TEXT, job_type public.job_type NOT NULL DEFAULT 'full_time',
  salary_min NUMERIC, salary_max NUMERIC,
  is_active BOOLEAN DEFAULT true,
  applications_count INT DEFAULT 0, views_count INT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Jobs public" ON public.jobs FOR SELECT USING (true);
CREATE POLICY "Post jobs" ON public.jobs FOR INSERT WITH CHECK (auth.uid() = posted_by);
CREATE POLICY "Owner updates jobs" ON public.jobs FOR UPDATE USING (auth.uid() = posted_by);
CREATE POLICY "Owner deletes jobs" ON public.jobs FOR DELETE USING (auth.uid() = posted_by);

-- JOB APPLICATIONS
CREATE TABLE public.job_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  applicant_id UUID NOT NULL,
  cover_letter TEXT, resume_url TEXT,
  status public.application_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);
ALTER TABLE public.job_applications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Applicants see own apps" ON public.job_applications FOR SELECT USING (auth.uid() = applicant_id);
CREATE POLICY "Job owner sees apps" ON public.job_applications FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.posted_by = auth.uid())
);
CREATE POLICY "Apply" ON public.job_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Job owner updates app" ON public.job_applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.jobs j WHERE j.id = job_id AND j.posted_by = auth.uid())
);

-- FACTORY PRODUCTS
CREATE TABLE public.factory_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  factory_id UUID NOT NULL, name TEXT NOT NULL, description TEXT,
  unit_price NUMERIC(12,2) NOT NULL, min_order_qty INT NOT NULL DEFAULT 1,
  available_qty INT DEFAULT 0, image_url TEXT, category TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.factory_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Factory products public" ON public.factory_products FOR SELECT USING (true);
CREATE POLICY "Factory manages products" ON public.factory_products FOR ALL USING (auth.uid() = factory_id) WITH CHECK (auth.uid() = factory_id);

-- NOTIFICATIONS
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, title TEXT NOT NULL, message TEXT,
  type public.notification_type NOT NULL DEFAULT 'system',
  is_read BOOLEAN DEFAULT false, link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users see notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

-- AUTO-CREATE WALLET ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name',''), COALESCE(NEW.raw_user_meta_data->>'phone',''));
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'customer'));
  INSERT INTO public.wallets (user_id, balance) VALUES (NEW.id, 0);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE INDEX idx_orders_customer ON public.orders(customer_id);
CREATE INDEX idx_orders_pilot ON public.orders(pilot_id);
CREATE INDEX idx_cart_user ON public.cart_items(user_id);
CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read);
