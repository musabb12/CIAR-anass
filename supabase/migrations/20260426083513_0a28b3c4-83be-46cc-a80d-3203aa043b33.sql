-- Escrow + Fawela + Smart Pricing fields
ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS service_fee numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pilot_tip numeric NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS distance_km numeric,
  ADD COLUMN IF NOT EXISTS escrow_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS escrow_code text,
  ADD COLUMN IF NOT EXISTS escrow_released_at timestamptz;

-- Wallet operations function: secure deposit / charge / release
CREATE OR REPLACE FUNCTION public.wallet_transact(
  _user_id uuid,
  _amount numeric,
  _type text,
  _description text DEFAULT NULL,
  _reference text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _wallet_id uuid;
  _new_balance numeric;
  _tx_id uuid;
BEGIN
  SELECT id, balance INTO _wallet_id, _new_balance
  FROM public.wallets WHERE user_id = _user_id FOR UPDATE;

  IF _wallet_id IS NULL THEN
    INSERT INTO public.wallets(user_id, balance) VALUES (_user_id, 0)
    RETURNING id, balance INTO _wallet_id, _new_balance;
  END IF;

  IF _type IN ('debit','escrow_hold') THEN
    IF _new_balance < _amount THEN
      RAISE EXCEPTION 'INSUFFICIENT_FUNDS';
    END IF;
    _new_balance := _new_balance - _amount;
  ELSIF _type IN ('credit','escrow_release','tip') THEN
    _new_balance := _new_balance + _amount;
  ELSE
    RAISE EXCEPTION 'INVALID_TYPE';
  END IF;

  UPDATE public.wallets SET balance = _new_balance, updated_at = now() WHERE id = _wallet_id;

  INSERT INTO public.transactions(wallet_id, user_id, type, amount, description, reference, status)
  VALUES (_wallet_id, _user_id, _type::transaction_type, _amount, _description, _reference, 'completed')
  RETURNING id INTO _tx_id;

  RETURN _tx_id;
END;
$$;

-- Confirm delivery via escrow code (releases funds + tip to pilot)
CREATE OR REPLACE FUNCTION public.confirm_delivery(_order_id uuid, _code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _order public.orders%ROWTYPE;
BEGIN
  SELECT * INTO _order FROM public.orders WHERE id = _order_id FOR UPDATE;
  IF _order IS NULL THEN RAISE EXCEPTION 'ORDER_NOT_FOUND'; END IF;
  IF auth.uid() != _order.customer_id THEN RAISE EXCEPTION 'NOT_AUTHORIZED'; END IF;
  IF _order.escrow_status != 'held' THEN RAISE EXCEPTION 'NOT_IN_ESCROW'; END IF;
  IF _order.escrow_code IS DISTINCT FROM _code THEN RAISE EXCEPTION 'INVALID_CODE'; END IF;

  -- release funds (mock: credit pilot if assigned, else mark released)
  IF _order.pilot_id IS NOT NULL THEN
    PERFORM public.wallet_transact(_order.pilot_id, _order.shipping_fee + COALESCE(_order.pilot_tip,0),
      'tip', 'أجرة + إكرامية الفوّالة', _order.order_number);
  END IF;

  UPDATE public.orders SET
    status = 'delivered',
    payment_status = 'paid',
    escrow_status = 'released',
    escrow_released_at = now(),
    updated_at = now()
  WHERE id = _order_id;

  INSERT INTO public.notifications(user_id, title, message, type, link)
  VALUES (_order.customer_id, 'تم تأكيد التسليم', 'شكراً! تم إتمام طلبك ' || _order.order_number, 'order'::notification_type, '/orders/' || _order_id);

  RETURN jsonb_build_object('ok', true);
END;
$$;