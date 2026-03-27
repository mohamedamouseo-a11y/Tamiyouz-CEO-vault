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

export default function TagsPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTagId, setEditingTagId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    color: "#8b5cf6",
  });

  const { data: tags, refetch } = trpc.tags.list.useQuery();

  const createTagMutation = trpc.tags.create.useMutation({
    onSuccess: () => {
      toast.success("Tag created successfully");
      setFormData({ name: "", color: "#8b5cf6" });
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create tag");
    },
  });

  const updateTagMutation = trpc.tags.update.useMutation({
    onSuccess: () => {
      toast.success("Tag updated successfully");
      setFormData({ name: "", color: "#8b5cf6" });
      setIsEditDialogOpen(false);
      setEditingTagId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update tag");
    },
  });

  const deleteTagMutation = trpc.tags.delete.useMutation({
    onSuccess: () => {
      toast.success("Tag deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete tag");
    },
  });

  const handleCreateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Tag name is required");
      return;
    }

    createTagMutation.mutate({
      name: formData.name,
      color: formData.color,
    });
  };

  const handleEditTag = (tag: any) => {
    setEditingTagId(tag.id);
    setFormData({
      name: tag.name,
      color: tag.color || "#8b5cf6",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateTag = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Tag name is required");
      return;
    }

    if (editingTagId !== null) {
      updateTagMutation.mutate({
        id: editingTagId,
        name: formData.name,
        color: formData.color,
      });
    }
  };

  const handleDeleteTag = (id: number) => {
    if (window.confirm("Are you sure you want to delete this tag?")) {
      deleteTagMutation.mutate({ id });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tags</h1>
          <p className="text-muted-foreground">Organize your accounts with tags</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Tag
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Tag</DialogTitle>
              <DialogDescription>Add a new tag to organize your accounts</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTag} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tag Name *</label>
                <Input
                  placeholder="e.g., Important"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-20 rounded border"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={createTagMutation.isPending}>
                {createTagMutation.isPending ? "Creating..." : "Create Tag"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Tag</DialogTitle>
              <DialogDescription>Update the tag information</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleUpdateTag} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Tag Name *</label>
                <Input
                  placeholder="e.g., Important"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="h-10 w-20 rounded border"
                  />
                  <Input
                    value={formData.color}
                    onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                    className="flex-1"
                  />
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={updateTagMutation.isPending}>
                {updateTagMutation.isPending ? "Updating..." : "Update Tag"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-3">
        {tags && tags.length > 0 ? (
          tags.map((tag) => (
            <div
              key={tag.id}
              className="flex items-center gap-2 px-3 py-2 rounded-full border"
              style={{ borderColor: tag.color || "#8b5cf6" }}
            >
              <div
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: tag.color || "#8b5cf6" }}
              />
              <span className="text-sm font-medium">{tag.name}</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0 ml-1"
                onClick={() => handleEditTag(tag)}
              >
                <Edit className="h-3 w-3" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={() => handleDeleteTag(tag.id)}
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          ))
        ) : (
          <Card className="w-full p-8 text-center text-muted-foreground">
            <p>No tags yet. Create your first tag to get started.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
