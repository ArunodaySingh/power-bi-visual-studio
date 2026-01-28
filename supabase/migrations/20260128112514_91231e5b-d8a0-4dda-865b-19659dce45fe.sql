-- Create dashboards table to store user-created dashboards
CREATE TABLE public.dashboards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  sheets_data JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.dashboards ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for view mode)
CREATE POLICY "Allow public read access"
ON public.dashboards
FOR SELECT
USING (true);

-- Allow public insert (for creating dashboards)
CREATE POLICY "Allow public insert"
ON public.dashboards
FOR INSERT
WITH CHECK (true);

-- Allow public update
CREATE POLICY "Allow public update"
ON public.dashboards
FOR UPDATE
USING (true);

-- Allow public delete
CREATE POLICY "Allow public delete"
ON public.dashboards
FOR DELETE
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_dashboards_updated_at
BEFORE UPDATE ON public.dashboards
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();