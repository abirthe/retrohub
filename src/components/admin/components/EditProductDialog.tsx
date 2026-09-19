import React, { useState, useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { updateProductDetails, type Product, type ProductCategory } from '@/lib/shopApi';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Package, Save } from 'lucide-react';
import { ALL_REGIONS } from '@/lib/regions';
import { Switch } from '@/components/ui/switch';

interface EditProductDialogProps {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}

export const EditProductDialog = ({ product, open, onClose }: EditProductDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<ProductCategory>('giftcard');
  const [platform, setPlatform] = useState('');
  const [region, setRegion] = useState('');
  const [salePrice, setSalePrice] = useState('');
  const [costPrice, setCostPrice] = useState('');
  const [inStock, setInStock] = useState('');
  const [deliveryType, setDeliveryType] = useState<'auto' | 'manual'>('manual');
  const [imageUrl, setImageUrl] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (product && open) {
      setTitle(product.title);
      setDescription(product.description || '');
      setCategory(product.category);
      setPlatform(product.platform || '');
      setRegion(product.region || 'GLOBAL');
      setSalePrice(product.sale_price.toString());
      setCostPrice(product.cost_price.toString());
      setInStock(product.in_stock?.toString() || '0');
      setDeliveryType(product.delivery_type);
      setImageUrl(product.image_url || '');
      setIsActive(product.is_active ?? true);
    }
  }, [product, open]);

  const handleSave = async () => {
    if (!product) return;
    setIsSaving(true);
    try {
      await updateProductDetails(product.id, {
        title,
        description: description || null,
        category,
        platform: platform || null,
        region: region as any,
        sale_price: Number(salePrice),
        cost_price: Number(costPrice),
        in_stock: Number(inStock),
        delivery_type: deliveryType,
        image_url: imageUrl || null,
        is_active: isActive
      });
      toast({ title: 'Success', description: 'Product updated successfully.' });
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] }); // in case frontend queries it
      onClose();
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!product) return null;

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="bg-card/95 backdrop-blur-xl border-white/10 sm:max-w-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-xl tracking-wide flex items-center gap-2">
            <Package className="w-5 h-5 text-primary" /> Edit Product
          </DialogTitle>
          <DialogDescription>
            Update all details for this product.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 col-span-2">
              <Label htmlFor="title" className="text-xs uppercase tracking-wider text-muted-foreground">Title</Label>
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-black/20 border-white/10" />
            </div>

            <div className="space-y-2 col-span-2">
              <Label htmlFor="description" className="text-xs uppercase tracking-wider text-muted-foreground">Description</Label>
              <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} className="bg-black/20 border-white/10" rows={3} />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category" className="text-xs uppercase tracking-wider text-muted-foreground">Category</Label>
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
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="region" className="text-xs uppercase tracking-wider text-muted-foreground">Region</Label>
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
              <Label htmlFor="platform" className="text-xs uppercase tracking-wider text-muted-foreground">Platform (e.g. Steam, Origin)</Label>
              <Input id="platform" value={platform} onChange={(e) => setPlatform(e.target.value)} className="bg-black/20 border-white/10" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="deliveryType" className="text-xs uppercase tracking-wider text-muted-foreground">Delivery Type</Label>
              <Select value={deliveryType} onValueChange={(val: 'auto' | 'manual') => setDeliveryType(val)}>
                <SelectTrigger className="bg-black/20 border-white/10">
                  <SelectValue placeholder="Select Delivery" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto">Auto (Instant)</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="costPrice" className="text-xs uppercase tracking-wider text-muted-foreground">Cost Price (৳)</Label>
              <Input id="costPrice" type="number" value={costPrice} onChange={(e) => setCostPrice(e.target.value)} className="bg-black/20 border-white/10" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="salePrice" className="text-xs uppercase tracking-wider text-muted-foreground">Sale Price (৳)</Label>
              <Input id="salePrice" type="number" value={salePrice} onChange={(e) => setSalePrice(e.target.value)} className="bg-black/20 border-white/10" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inStock" className="text-xs uppercase tracking-wider text-muted-foreground">Stock Amount</Label>
              <Input id="inStock" type="number" value={inStock} onChange={(e) => setInStock(e.target.value)} className="bg-black/20 border-white/10" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="imageUrl" className="text-xs uppercase tracking-wider text-muted-foreground">Image URL</Label>
              <Input id="imageUrl" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="bg-black/20 border-white/10" />
            </div>

            <div className="space-y-2 col-span-2 flex flex-row items-center justify-between rounded-lg border border-white/10 p-4 bg-black/20">
              <div className="space-y-0.5">
                <Label className="text-base text-foreground font-display">Active on Store</Label>
                <p className="text-sm text-muted-foreground">
                  Should this product be visible to customers?
                </p>
              </div>
              <Switch checked={isActive} onCheckedChange={setIsActive} />
            </div>

          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
          <Button onClick={handleSave} disabled={isSaving} className="gradient-primary">
            {isSaving ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Changes</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
