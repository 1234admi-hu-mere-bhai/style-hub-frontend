DROP POLICY IF EXISTS "Deny all client access to push_config" ON public.push_config;
CREATE POLICY "Deny all client access to push_config"
  ON public.push_config
  AS RESTRICTIVE
  FOR ALL
  TO public
  USING (false)
  WITH CHECK (false);