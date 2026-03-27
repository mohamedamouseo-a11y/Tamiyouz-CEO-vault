import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { 
  Plus, 
  Search, 
  Filter, 
  Trash2, 
  Edit, 
  Eye, 
  X, 
  ArrowUpDown, 
  ArrowUp, 
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from "lucide-react";
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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

type SortBy = 'name' | 'email' | 'createdAt' | 'expirationDate';
type SortOrder = 'asc' | 'desc';

export default function AccountsPage() {
  const [, navigate] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Pagination & Sorting State
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [sortBy, setSortBy] = useState<SortBy>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

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

  // Query params
  const queryParams = {
    search: searchTerm,
    categoryId: filters.categoryId,
    tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
    taskLinkStatus: filters.taskLinkStatus,
    expirationDateFrom: filters.expirationDateFrom,
    expirationDateTo: filters.expirationDateTo,
    sortBy,
    sortOrder,
    page,
    pageSize,
  };

  // Fetch accounts with filters, sorting, and pagination
  const { data: accounts, isLoading, refetch } = trpc.accounts.list.useQuery(queryParams);
  
  // Fetch total count for pagination
  const { data: countData } = trpc.accounts.count.useQuery({
    search: searchTerm,
    categoryId: filters.categoryId,
    tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
    taskLinkStatus: filters.taskLinkStatus,
    expirationDateFrom: filters.expirationDateFrom,
    expirationDateTo: filters.expirationDateTo,
  });

  const totalCount = typeof countData === 'number' ? countData : (countData as any)?.count || 0;
  const totalPages = Math.ceil(totalCount / pageSize);

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

  const bulkDeleteMutation = trpc.accounts.bulkDelete.useMutation({
    onSuccess: (data) => {
      toast.success(`Successfully deleted ${data.deletedCount} account(s)`);
      setSelectedIds([]);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete accounts");
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

  const handleBulkDelete = () => {
    if (selectedIds.length === 0) return;
    if (window.confirm(`Are you sure you want to delete ${selectedIds.length} selected account(s)?`)) {
      bulkDeleteMutation.mutate({ ids: selectedIds });
    }
  };

  const handleToggleTag = (tagId: number) => {
    setFilters(prev => ({
      ...prev,
      tagIds: prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId]
    }));
    setPage(1); // Reset to first page on filter change
  };

  const handleClearFilters = () => {
    setFilters({
      categoryId: undefined,
      tagIds: [],
      taskLinkStatus: undefined,
      expirationDateFrom: undefined,
      expirationDateTo: undefined,
    });
    setPage(1);
  };

  const handleSort = (field: SortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked && accounts) {
      setSelectedIds(accounts.map(acc => acc.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectRow = (id: number, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
    }
  };

  const hasActiveFilters = useMemo(() => {
    return filters.categoryId !== undefined ||
      filters.tagIds.length > 0 ||
      filters.taskLinkStatus !== undefined ||
      filters.expirationDateFrom !== undefined ||
      filters.expirationDateTo !== undefined;
  }, [filters]);

  const renderSortIcon = (field: SortBy) => {
    if (sortBy !== field) return <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />;
    return sortOrder === 'asc' ? <ArrowUp className="ml-2 h-4 w-4" /> : <ArrowDown className="ml-2 h-4 w-4" />;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Accounts</h1>
          <p className="text-muted-foreground">Manage your stored accounts and credentials</p>
        </div>
        <div className="flex gap-2">
          {selectedIds.length > 0 && (
            <Button 
              variant="destructive" 
              className="gap-2"
              onClick={handleBulkDelete}
              disabled={bulkDeleteMutation.isPending}
            >
              <Trash2 className="h-4 w-4" />
              Delete ({selectedIds.length})
            </Button>
          )}
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
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search accounts..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPage(1);
              }}
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
                    onValueChange={(value) => {
                      setFilters(prev => ({
                        ...prev,
                        categoryId: value ? parseInt(value) : undefined
                      }));
                      setPage(1);
                    }}
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
                    onValueChange={(value) => {
                      setFilters(prev => ({
                        ...prev,
                        taskLinkStatus: value || undefined
                      }));
                      setPage(1);
                    }}
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
                    onChange={(e) => {
                      setFilters(prev => ({
                        ...prev,
                        expirationDateFrom: e.target.value ? new Date(e.target.value) : undefined
                      }));
                      setPage(1);
                    }}
                  />
                </div>

                {/* Expiration Date To */}
                <div>
                  <label className="text-sm font-medium">Expiration Date To</label>
                  <Input
                    type="date"
                    value={filters.expirationDateTo ? filters.expirationDateTo.toISOString().split('T')[0] : ""}
                    onChange={(e) => {
                      setFilters(prev => ({
                        ...prev,
                        expirationDateTo: e.target.value ? new Date(e.target.value) : undefined
                      }));
                      setPage(1);
                    }}
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
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={accounts && accounts.length > 0 && selectedIds.length === accounts.length}
                    onCheckedChange={(checked) => handleSelectAll(!!checked)}
                    aria-label="Select all"
                  />
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Name {renderSortIcon('name')}
                  </div>
                </TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort('email')}
                >
                  <div className="flex items-center">
                    Email {renderSortIcon('email')}
                  </div>
                </TableHead>
                <TableHead>Username</TableHead>
                <TableHead>URL</TableHead>
                <TableHead 
                  className="cursor-pointer hover:text-primary transition-colors"
                  onClick={() => handleSort('createdAt')}
                >
                  <div className="flex items-center">
                    Created {renderSortIcon('createdAt')}
                  </div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-8">
                    Loading accounts...
                  </TableCell>
                </TableRow>
              ) : accounts && accounts.length > 0 ? (
                accounts.map((account) => (
                  <TableRow key={account.id} className={`hover:bg-muted/50 ${selectedIds.includes(account.id) ? "bg-muted" : ""}`}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedIds.includes(account.id)}
                        onCheckedChange={(checked) => handleSelectRow(account.id, !!checked)}
                        aria-label={`Select ${account.name}`}
                      />
                    </TableCell>
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
                      {new Date(account.createdAt).toLocaleDateString()}
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
                  <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                    No accounts found. Create your first account to get started.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    className={page === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => {
                  // Basic pagination logic: show first, last, and pages around current
                  if (
                    p === 1 || 
                    p === totalPages || 
                    (p >= page - 1 && p <= page + 1)
                  ) {
                    return (
                      <PaginationItem key={p}>
                        <PaginationLink 
                          isActive={page === p}
                          onClick={() => setPage(p)}
                          className="cursor-pointer"
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  } else if (p === page - 2 || p === page + 2) {
                    return (
                      <PaginationItem key={p}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    );
                  }
                  return null;
                })}

                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    className={page === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
            <div className="text-center text-sm text-muted-foreground mt-2">
              Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, totalCount)} of {totalCount} accounts
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
