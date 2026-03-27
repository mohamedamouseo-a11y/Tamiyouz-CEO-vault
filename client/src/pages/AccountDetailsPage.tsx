import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Copy, Edit, Trash2, Save, X } from "lucide-react";
import { toast } from "sonner";

interface AccountDetailsPageProps {
  accountId: number;
}

export default function AccountDetailsPage({ accountId }: AccountDetailsPageProps) {
  const [, navigate] = useLocation();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState<any>(null);

  const { data: accountData, isLoading, refetch } = trpc.accounts.getById.useQuery({
    id: accountId,
  });

  const updateAccountMutation = trpc.accounts.update.useMutation({
    onSuccess: () => {
      toast.success("Account updated successfully");
      setIsEditing(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update account");
    },
  });

  const deleteAccountMutation = trpc.accounts.delete.useMutation({
    onSuccess: () => {
      toast.success("Account deleted successfully");
      navigate("/dashboard/accounts");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete account");
    },
  });

  const handleCopyToClipboard = (text: string | null | undefined) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const handleSaveChanges = () => {
    if (!editData) return;

    updateAccountMutation.mutate({
      id: accountId,
      name: editData.name,
      email: editData.email,
      username: editData.username,
      url: editData.url,
      description: editData.description,
      taskLinkStatus: editData.taskLinkStatus,
    });
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure you want to delete this account? This action cannot be undone.")) {
      deleteAccountMutation.mutate({ id: accountId });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard/accounts")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="text-center py-12">Loading account details...</div>
      </div>
    );
  }

  if (!accountData?.account) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => navigate("/dashboard/accounts")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <Card className="p-8 text-center text-muted-foreground">
          Account not found
        </Card>
      </div>
    );
  }

  const account = accountData.account;
  const displayData = isEditing && editData ? editData : account;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => navigate("/dashboard/accounts")}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div className="flex gap-2">
          {isEditing ? (
            <>
              <Button onClick={handleSaveChanges} disabled={updateAccountMutation.isPending}>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => {
                  setEditData({ ...account });
                  setIsEditing(true);
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="destructive"
                onClick={handleDeleteAccount}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </>
          )}
        </div>
      </div>

      <Card className="p-6">
        <h1 className="text-3xl font-bold mb-6">{displayData.name}</h1>

        <div className="grid gap-6">
          {/* Name */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Account Name</label>
            {isEditing ? (
              <Input
                value={editData.name}
                onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                className="mt-2"
              />
            ) : (
              <p className="mt-2 text-lg">{displayData.name}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            {isEditing ? (
              <Input
                type="email"
                value={editData.email || ""}
                onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                className="mt-2"
              />
            ) : (
              <div className="mt-2 flex items-center justify-between">
                <p className="text-lg">{displayData.email || "-"}</p>
                {displayData.email && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyToClipboard(displayData.email)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Username */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Username</label>
            {isEditing ? (
              <Input
                value={editData.username || ""}
                onChange={(e) => setEditData({ ...editData, username: e.target.value })}
                className="mt-2"
              />
            ) : (
              <div className="mt-2 flex items-center justify-between">
                <p className="text-lg">{displayData.username || "-"}</p>
                {displayData.username && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyToClipboard(displayData.username)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* URL */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Website URL</label>
            {isEditing ? (
              <Input
                value={editData.url || ""}
                onChange={(e) => setEditData({ ...editData, url: e.target.value })}
                className="mt-2"
              />
            ) : (
              <div className="mt-2">
                {displayData.url ? (
                  <a
                    href={displayData.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-accent hover:underline"
                  >
                    {displayData.url}
                  </a>
                ) : (
                  <p>-</p>
                )}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Description</label>
            {isEditing ? (
              <Input
                value={editData.description || ""}
                onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                className="mt-2"
              />
            ) : (
              <p className="mt-2 text-lg">{displayData.description || "-"}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Status</label>
            <div className="mt-2">
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                displayData.taskLinkStatus === "active"
                  ? "bg-green-100 text-green-800"
                  : "bg-yellow-100 text-yellow-800"
              }`}>
                {displayData.taskLinkStatus || "active"}
              </span>
            </div>
          </div>

          {/* Created At */}
          <div>
            <label className="text-sm font-medium text-muted-foreground">Created</label>
            <p className="mt-2 text-lg">
              {new Date(displayData.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
