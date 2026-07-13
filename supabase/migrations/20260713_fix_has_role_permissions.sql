-- Restore execute permissions on has_role function for RLS policies to work
GRANT EXECUTE ON FUNCTION public.has_role(UUID, public.app_role) TO authenticated;
