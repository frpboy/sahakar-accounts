'use client';

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth-context';
import { createClientBrowser } from '@/lib/supabase-client';
import { Loader2 } from 'lucide-react';

interface SupplierModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (supplier: any) => void;
}

export function SupplierModal({ isOpen, onClose, onSuccess }: SupplierModalProps) {
    const { user } = useAuth();
    const supabase = createClientBrowser();

    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
        email: '',
        gstin: '',
        address: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.profile?.outlet_id) return;

        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('suppliers')
                .insert({
                    outlet_id: user.profile.outlet_id,
                    name: formData.name.trim(),
                    phone: formData.phone.trim() || null,
                    email: formData.email.trim() || null,
                    gstin: formData.gstin.trim() || null,
                    address: formData.address.trim() || null
                })
                .select()
                .single();

            if (error) throw error;

            onSuccess(data);
            handleClose();
        } catch (error) {
            console.error('Error adding supplier:', error);
            alert('Failed to add supplier');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setFormData({ name: '', phone: '', email: '', gstin: '', address: '' });
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-slate-900 border dark:border-slate-800">
                <DialogHeader>
                    <DialogTitle className="dark:text-white">Add New Supplier</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right dark:text-slate-300">Name *</Label>
                        <Input
                            id="name"
                            required
                            className="col-span-3 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            value={formData.name}
                            onChange={(e) => setFormData(d => ({ ...d, name: e.target.value }))}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="phone" className="text-right dark:text-slate-300">Phone</Label>
                        <Input
                            id="phone"
                            className="col-span-3 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            value={formData.phone}
                            onChange={(e) => setFormData(d => ({ ...d, phone: e.target.value }))}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="gstin" className="text-right dark:text-slate-300">GSTIN</Label>
                        <Input
                            id="gstin"
                            className="col-span-3 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            value={formData.gstin}
                            onChange={(e) => setFormData(d => ({ ...d, gstin: e.target.value }))}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="address" className="text-right dark:text-slate-300">Address</Label>
                        <Input
                            id="address"
                            className="col-span-3 dark:bg-slate-800 dark:border-slate-700 dark:text-white"
                            value={formData.address}
                            onChange={(e) => setFormData(d => ({ ...d, address: e.target.value }))}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={loading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Save Supplier
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
