import React, { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createProduct, type Product, type ProductCategory } from '@/lib/shopApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save } from 'lucide-react';
import { ALL_REGIONS } from '@/lib/regions';
import { Switch } from '@/components/ui/switch';

export const AddProductDialog = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('giftcard');
  const [platform, setPlatform] = useState('');
  const [region, setRegion] = useState('GLOBAL');
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [inStock, setInStock] = useState('10');
  const [deliveryType, setDeliveryType] = useState<Product['delivery_type']>('instant_code');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('giftcard');
    setPlatform('');
    setRegion('GLOBAL');
    setSalePrice('');
    setCostPrice('');
    setInStock('10');
    setDeliveryType('instant_code');
    setImageUrl('');
    setIsActive(true);
  };

  const handleSave = async () => {
    if (!title || !salePrice || !costPrice) {
      toast({ title: 'Validation Error', description: 'Title, Sale Price, and Cost Price are required.', variant: 'destructive' });
      return;
    }
    
    setIsSaving(true);
    try {
      await createProduct({
        title,
        description: description || null,
        category,
        platform: platform || null,
        region: region as Product['region'],
        sale_price: Number(salePrice),
        cost_price: Number(costPrice),
        in_stock: Number(inStock),
        delivery_type: deliveryType,
        image_url: imageUrl || null,
        is_active: isActive,
        source_platform: null,
        source_url: null
      });
      toast({ title: 'Success', description: 'Product created successfully.' });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); 
      setOpen(false);
      resetForm();
    } catch (error: unknown) {
      toast({ title: 'Error', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen && !isSaving) {
        setOpen(false);
        resetForm();
      } else if (isOpen) {
        setOpen(true);
      }
    }}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" /> Add Product
        </Button>
      </DialogTrigger>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10 sm:max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-wide flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Create New Product
          </DialogTitle>
          <DialogDescription>
            Add a new product to your store's inventory.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="new-title" className="text-xs uppercase tracking-wider text-muted-foreground">Title *</Label>
              <Input id="new-title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-black/20 border-white/10" placeholder="Product Title" />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="new-description" className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea id="new-description" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-black/20 border-white/10" rows={3} placeholder="Optional description..." />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-category" className="text-xs uppercase tracking-wider text-muted-foreground">Category *</Label>
              <Select value={category} onValueChange={(val: ProductCategory) => setCategory(val)}>
                <SelectTrigger className="bg-black/20 border-white/10">
                  <SelectValue placeholder="Select Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="giftcard">Gift Card</SelectItem>
                  <SelectItem value="topup">Top Up</SelectItem>
                  <SelectItem value="subscription">Subscription</SelectItem>
                  <SelectItem value="pc_game">PC Game</SelectItem>
                  <SelectItem value="xbox_game">Xbox Game</SelectItem>
                  <SelectItem value="ps_game">PS Game</SelectItem>
                  <SelectItem value="software">Software</SelectItem>
                  <SelectItem value="service">Service</SelectItem>
                  <SelectItem value="accounts">Accounts</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-region" className="text-xs uppercase tracking-wider text-muted-foreground">Region *</Label>
              <Select value={region} onValueChange={setRegion}>
                <SelectTrigger className="bg-black/20 border-white/10">
                  <SelectValue placeholder="Select Region" />
                </SelectTrigger>
                <SelectContent>
                  {ALL_REGIONS.map((r) => (
                    <SelectItem key={r.code} value={r.code}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-platform" className="text-xs uppercase tracking-wider text-muted-foreground">Platform (e.g. Steam)</Label>
              <Input id="new-platform" value={platform} onChange={(e) => setPlatform(e.target.value)} className="bg-black/20 border-white/10" placeholder="Optional" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-deliveryType" className="text-xs uppercase tracking-wider text-muted-foreground">Delivery Type *</Label>
              <Select value={deliveryType} onValueChange={(val: Product['delivery_type']) => setDeliveryType(val)}>
                <SelectTrigger className="bg-black/20 border-white/10">
                  <SelectValue placeholder="Select Delivery" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instant_code">Instant Code (Instant - 30min)</SelectItem>
                  <SelectItem value="api_h2h">API H2H (Automated)</SelectItem>
                  <SelectItem value="automation">Automation Bot</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-costPrice" className="text-xs uppercase tracking-wider text-muted-foreground">Cost Price (৳) *</Label>
              <Input id="new-costPrice" type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="bg-black/20 border-white/10" placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-salePrice" className="text-xs uppercase tracking-wider text-muted-foreground">Sale Price (৳) *</Label>
              <Input id="new-salePrice" type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="bg-black/20 border-white/10" placeholder="0.00" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-inStock" className="text-xs uppercase tracking-wider text-muted-foreground">Stock Amount *</Label>
              <Input id="new-inStock" type="number" value={inStock} onChange={(e) => setInStock(e.target.value)} className="bg-black/20 border-white/10" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="new-imageUrl" className="text-xs uppercase tracking-wider text-muted-foreground">Image URL</Label>
              <Input id="new-imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="bg-black/20 border-white/10" placeholder="https://..." />
            </div>

            <div className="space-y-2 col-span-2 flex flex-row items-center justify-between rounded-lg border border-white/10 p-4 bg-black/20">
              <div className="space-y-0.5">
                <Label className="text-base text-foreground font-display">Active on Store</Label>
                <p className="text-sm text-muted-foreground">
                  Should this product be visible to customers immediately?
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving} className="gradient-primary">
            {isSaving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Create Product</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
