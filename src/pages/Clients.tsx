import React, { useState } from 'react';
import { Plus, Edit, Trash2, Mail, Phone, MapPin } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { useStore } from '@/store/useStore';
import { Client } from '@/types';
import { formatDate } from '@/lib/utils';

export const Clients: React.FC = () => {
  const { clients, addClient, updateClient, deleteClient } = useStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    companyName: '',
    email: '',
    phone: '',
    hasAddress: true,
    line1: '',
    line2: '',
    city: '',
    postcode: '',
    country: 'United Kingdom',
  });

  const handleOpenModal = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        companyName: client.companyName || '',
        email: client.email,
        phone: client.phone,
        hasAddress: !!client.address,
        line1: client.address?.line1 || '',
        line2: client.address?.line2 || '',
        city: client.address?.city || '',
        postcode: client.address?.postcode || '',
        country: client.address?.country || 'United Kingdom',
      });
    } else {
      setEditingClient(null);
      setFormData({
        name: '',
        companyName: '',
        email: '',
        phone: '',
        hasAddress: true,
        line1: '',
        line2: '',
        city: '',
        postcode: '',
        country: 'United Kingdom',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const clientData: any = {
      name: formData.name,
      companyName: formData.companyName || undefined,
      email: formData.email,
      phone: formData.phone,
    };

    if (formData.hasAddress && formData.line1 && formData.city && formData.postcode) {
      clientData.address = {
        line1: formData.line1,
        line2: formData.line2 || undefined,
        city: formData.city,
        postcode: formData.postcode,
        country: formData.country,
      };
    }

    if (editingClient) {
      updateClient(editingClient.id, clientData);
    } else {
      addClient(clientData);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this client?')) {
      deleteClient(id);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
          <p className="text-gray-600 mt-2">Manage your client information</p>
        </div>
        <Button onClick={() => handleOpenModal()}>
          <Plus className="mr-2" size={20} />
          Add Client
        </Button>
      </div>

      {clients.length === 0 ? (
        <Card>
          <CardContent>
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No clients yet. Add your first client to get started.</p>
              <Button onClick={() => handleOpenModal()}>
                <Plus className="mr-2" size={20} />
                Add Client
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((client) => (
            <Card key={client.id}>
              <CardContent>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">{client.name}</h3>
                    {client.companyName && (
                      <p className="text-sm text-gray-600 mt-1">{client.companyName}</p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleOpenModal(client)}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <Edit size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(client.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm text-gray-600">
                  <div className="flex items-center">
                    <Mail size={16} className="mr-2" />
                    <a href={`mailto:${client.email}`} className="hover:text-primary-600">
                      {client.email}
                    </a>
                  </div>
                  <div className="flex items-center">
                    <Phone size={16} className="mr-2" />
                    <a href={`tel:${client.phone}`} className="hover:text-primary-600">
                      {client.phone}
                    </a>
                  </div>
                  {client.address && (
                    <div className="flex items-start">
                      <MapPin size={16} className="mr-2 mt-0.5" />
                      <div>
                        <p>{client.address.line1}</p>
                        {client.address.line2 && <p>{client.address.line2}</p>}
                        <p>{client.address.city}, {client.address.postcode}</p>
                        <p>{client.address.country}</p>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200 text-xs text-gray-500">
                  Added {formatDate(client.createdAt)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingClient ? 'Edit Client' : 'Add New Client'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Client Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
          
          <Input
            label="Company Name (Optional)"
            value={formData.companyName}
            onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="hasAddress"
              checked={formData.hasAddress}
              onChange={(e) => setFormData({ ...formData, hasAddress: e.target.checked })}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="hasAddress" className="ml-2 text-sm font-medium text-gray-700">
              Include address details
            </label>
          </div>
          
          {formData.hasAddress && (
            <>
              <Input
                label="Address Line 1"
                value={formData.line1}
                onChange={(e) => setFormData({ ...formData, line1: e.target.value })}
                required={formData.hasAddress}
              />
              
              <Input
                label="Address Line 2 (Optional)"
                value={formData.line2}
                onChange={(e) => setFormData({ ...formData, line2: e.target.value })}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="City"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required={formData.hasAddress}
                />
                <Input
                  label="Postcode"
                  value={formData.postcode}
                  onChange={(e) => setFormData({ ...formData, postcode: e.target.value })}
                  required={formData.hasAddress}
                />
              </div>
              
              <Input
                label="Country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required={formData.hasAddress}
              />
            </>
          )}
          
          <div className="flex gap-4 pt-4">
            <Button type="submit" className="flex-1">
              {editingClient ? 'Update Client' : 'Add Client'}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
