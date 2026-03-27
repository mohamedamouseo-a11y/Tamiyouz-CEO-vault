import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Plus, Search, Filter, Trash2, Edit, Eye, X } from "lucide-react";
import { useLocation } from "wouter";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { toast } from "sonner";

export default function AccountsPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    url: "",
    description: "",
  });

  // Filter states
  const [filters, setFilters] = useState({
    categoryId: undefined as number | undefined,
    tagIds: [] as number[],
    taskLinkStatus: undefined as string | undefined,
    expirationDateFrom: undefined as Date | undefined,
    expirationDateTo: undefined as Date | undefined,
  });

  // Fetch categories and tags for filter dropdowns
  const { data: categories } = trpc.categories.list.useQuery();
  const { data: tags } = trpc.tags.list.useQuery();

  // Fetch accounts with filters
  const { data: accounts, isLoading, refetch } = trpc.accounts.list.useQuery({
    search: searchTerm,
    categoryId: filters.categoryId,
    tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
    taskLinkStatus: filters.taskLinkStatus,
    expirationDateFrom: filters.expirationDateFrom,
    expirationDateTo: filters.expirationDateTo,
  });

  const createAccountMutation = trpc.accounts.create.useMutation({
    onSuccess: () => {
      toast.success("Account created successfully");
      setFormData({ name: "", email: "", username: "", url: "", description: "" });
      setIsCreateDialogOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create account");
    },
  });

  const deleteAccountMutation = trpc.accounts.delete.useMutation({
    onSuccess: () => {
      toast.success("Account deleted successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete account");
    },
  });

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Account name is required");
      return;
    }

    createAccountMutation.mutate({
      name: formData.name,
      email: formData.email || undefined,
      username: formData.username || undefined,
      url: formData.url || undefined,
      description: formData.description || undefined,
    });
  };

  const handleDeleteAccount = (id: number) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      deleteAccountMutation.mutate({ id });
    }
  };

  const handleToggleTag = (tagId: number) => {
    setFilters(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId]
    }));
  };

  const handleClearFilters = () => {
    setFilters({
      categoryId: undefined,
      tagIds: [],
      taskLinkStatus: undefined,
      expirationDateFrom: undefined,
      expirationDateTo: undefined,
    });
  };

  const hasActiveFilters = useMemo(() => {
    return filters.categoryId !== undefined ||
      filters.tagIds.length > 0 ||
      filters.taskLinkStatus !== undefined ||
      filters.expirationDateFrom !== undefined ||
      filters.expirationDateTo !== undefined;
  }, [filters]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">Manage your stored accounts and credentials</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              New Account
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Account</DialogTitle>
              <DialogDescription>
                Add a new account to your vault
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Account Name *</label>
                <Input
                  placeholder="e.g., Gmail"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input
                  type="email"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Username</label>
                <Input
                  placeholder="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">URL</label>
                <Input
                  placeholder="https://example.com"
                  value={formData.url}
                  onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Input
                  placeholder="Additional notes"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createAccountMutation.isPending}>
                {createAccountMutation.isPending ? "Creating..." : "Create Account"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" />
                Filters
                {hasActiveFilters && (
                  <span className="ml-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
                    {Object.values(filters).filter(v => v !== undefined && (Array.isArray(v) ? v.length > 0 : true)).length}
                  </span>
                )}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Advanced Filters</DialogTitle>
                <DialogDescription>
                  Filter accounts by category, tags, status, and expiration date
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Category Filter */}
                <div>
                  <label className="text-sm font-medium">Category</label>
                  <Select
                    value={filters.categoryId?.toString() || ""}
                    onValueChange={(value) => setFilters(prev => ({
                      ...prev,
                      categoryId: value ? parseInt(value) : undefined
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category..." />
                    </SelectTrigger>
                    <SelectContent>
                      {categories?.map(cat => (
                        <SelectItem key={cat.id} value={cat.id.toString()}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Task Link Status Filter */}
                <div>
                  <label className="text-sm font-medium">Link Status</label>
                  <Select
                    value={filters.taskLinkStatus || ""}
                    onValueChange={(value) => setFilters(prev => ({
                      ...prev,
                      taskLinkStatus: value || undefined
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Expiration Date From */}
                <div>
                  <label className="text-sm font-medium">Expiration Date From</label>
                  <Input
                    type="date"
                    value={filters.expirationDateFrom ? filters.expirationDateFrom.toISOString().split('T')[0] : ""}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      expirationDateFrom: e.target.value ? new Date(e.target.value) : undefined
                    }))}
                  />
                </div>

                {/* Expiration Date To */}
                <div>
                  <label className="text-sm font-medium">Expiration Date To</label>
                  <Input
                    type="date"
                    value={filters.expirationDateTo ? filters.expirationDateTo.toISOString().split('T')[0] : ""}
                    onChange={(e) => setFilters(prev => ({
                      ...prev,
                      expirationDateTo: e.target.value ? new Date(e.target.value) : undefined
                    }))}
                  />
                </div>

                {/* Tags Filter */}
                <div>
                  <label className="text-sm font-medium">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {tags?.map(tag => (
                      <button
                        key={tag.id}
                        onClick={() => handleToggleTag(tag.id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                          filters.tagIds.includes(tag.id)
                            ? "bg-blue-600 text-white"
                            : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                        }`}
                        style={filters.tagIds.includes(tag.id) && tag.color ? { backgroundColor: tag.color } : {}}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filter Actions */}
                <div className="flex gap-2 pt-4">
                  <Button
                    variant="outline"
                    onClick={handleClearFilters}
                    className="flex-1"
                  >
                    Clear Filters
                  </Button>
                  <Button
                    onClick={() => setIsFilterOpen(false)}
                    className="flex-1"
                  >
                    Apply Filters
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </Card>

      {/* Accounts Table */}
      <Card>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading accounts...
                  </TableCell>
                </TableRow>
              ) : accounts && accounts.length > 0 ? (
                accounts.map((account) => (
                  <TableRow key={account.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{account.name}</TableCell>
                    <TableCell>{account.email || "-"}</TableCell>
                    <TableCell>{account.username || "-"}</TableCell>
                    <TableCell>
                      {account.url ? (
                        <a href={account.url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">
                          View
                        </a>
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        account.taskLinkStatus === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-yellow-100 text-yellow-800"
                      }`}>
                        {account.taskLinkStatus || "active"}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/dashboard/accounts/${account.id}`)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/dashboard/accounts/${account.id}`)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteAccount(account.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No accounts found. Create your first account to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
