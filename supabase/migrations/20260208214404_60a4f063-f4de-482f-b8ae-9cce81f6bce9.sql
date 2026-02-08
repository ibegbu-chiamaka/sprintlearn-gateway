-- Allow admins to manage withdrawal requests
CREATE POLICY "Admins can manage withdrawals"
ON public.withdrawal_requests
FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to update profiles (for verification)
CREATE POLICY "Admins can update any profile"
ON public.profiles
FOR UPDATE
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to view all enrollments
CREATE POLICY "Admins can view all enrollments"
ON public.enrollments
FOR SELECT
USING (has_role(auth.uid(), 'admin'));

-- Allow admins to view all revenue
CREATE POLICY "Admins can view all revenue"
ON public.instructor_revenue
FOR SELECT
USING (has_role(auth.uid(), 'admin'));