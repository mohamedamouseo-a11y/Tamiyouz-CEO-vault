import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DashboardLayout from "./components/DashboardLayout";
import AccountsPage from "./pages/AccountsPage";
import CategoriesPage from "./pages/CategoriesPage";
import TagsPage from "./pages/TagsPage";
import CustomFieldsPage from "./pages/CustomFieldsPage";
import NotificationsPage from "./pages/NotificationsPage";
import AccountDetailsPage from "./pages/AccountDetailsPage";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"}>
        {() => (
          <DashboardLayout>
            <AccountsPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/dashboard/accounts"}>
        {() => (
          <DashboardLayout>
            <AccountsPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/dashboard/accounts/:id"}>
        {(params) => (
          <DashboardLayout>
            <AccountDetailsPage accountId={parseInt(params.id)} />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/dashboard/categories"}>
        {() => (
          <DashboardLayout>
            <CategoriesPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/dashboard/tags"}>
        {() => (
          <DashboardLayout>
            <TagsPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/dashboard/custom-fields"}>
        {() => (
          <DashboardLayout>
            <CustomFieldsPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/dashboard/notifications"}>
        {() => (
          <DashboardLayout>
            <NotificationsPage />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
