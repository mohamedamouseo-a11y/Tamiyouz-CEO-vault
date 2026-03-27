import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Trash2, Edit } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CustomFieldsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    fieldType: "text" as const,
    isRequired: false,
    placeholder: "",
    description: "",
  });

  const { data: templates, refetch } = trpc.customFields.listTemplates.useQuery();

  const createTemplateMutation = trpc.customFields.createTemplate.useMutation({
    onSuccess: () => {
      toast.success("Custom field created successfully");
      setFormData({
        name: "",
        fieldType: "text",
        isRequired: false,
        placeholder: "",
        description: "",
      });
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create custom field");
    },
  });

  const deleteTemplateMutation = trpc.customFields.deleteTemplate.useMutation({
    onSuccess: () => {
      toast.success("Custom field deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete custom field");
    },
  });

  const handleCreateTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Field name is required");
      return;
    }

    createTemplateMutation.mutate({
      name: formData.name,
      fieldType: formData.fieldType,
      isRequired: formData.isRequired,
      placeholder: formData.placeholder || undefined,
      description: formData.description || undefined,
    });
  };

  const handleDeleteTemplate = (id: number) => {
    if (window.confirm("Are you sure you want to delete this custom field?")) {
      deleteTemplateMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Custom Fields</h1>
          <p className="text-muted-foreground">Create custom fields for your accounts</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Field
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Custom Field</DialogTitle>
              <DialogDescription>Add a new custom field template</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTemplate} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Field Name *</label>
                <Input
                  placeholder="e.g., Security Question"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Field Type *</label>
                <Select value={formData.fieldType} onValueChange={(value: any) => setFormData({ ...formData, fieldType: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text</SelectItem>
                    <SelectItem value="number">Number</SelectItem>
                    <SelectItem value="date">Date</SelectItem>
                    <SelectItem value="select">Select</SelectItem>
                    <SelectItem value="checkbox">Checkbox</SelectItem>
                    <SelectItem value="textarea">Textarea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium">Placeholder</label>
                <Input
                  placeholder="Optional placeholder text"
                  value={formData.placeholder}
                  onChange={(e) => setFormData({ ...formData, placeholder: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Optional description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="isRequired"
                  checked={formData.isRequired}
                  onChange={(e) => setFormData({ ...formData, isRequired: e.target.checked })}
                  className="rounded border"
                />
                <label htmlFor="isRequired" className="text-sm font-medium">
                  Required field
                </label>
              </div>
              <Button type="submit" className="w-full" disabled={createTemplateMutation.isPending}>
                {createTemplateMutation.isPending ? "Creating..." : "Create Field"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {templates && templates.length > 0 ? (
          templates.map((template) => (
            <Card key={template.id} className="p-4 flex items-center justify-between hover:bg-muted/50">
              <div>
                <h3 className="font-semibold">{template.name}</h3>
                <div className="flex gap-2 mt-1 text-xs text-muted-foreground">
                  <span className="px-2 py-1 bg-muted rounded">
                    {template.fieldType}
                  </span>
                  {template.isRequired && (
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded">
                      Required
                    </span>
                  )}
                </div>
                {template.description && (
                  <p className="text-sm text-muted-foreground mt-2">{template.description}</p>
                )}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm">
                  <Edit className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDeleteTemplate(template.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-8 text-center text-muted-foreground">
            <p>No custom fields yet. Create your first field to get started.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
