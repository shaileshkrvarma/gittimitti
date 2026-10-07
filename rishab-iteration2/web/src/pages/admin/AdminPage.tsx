import { Box, Tab, Tabs } from '@mui/material'
import { Link as RouterLink, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import OverviewTab from './OverviewTab'
import UsersTab from './UsersTab'
import { CategoriesTab, ProductsTab, SuppliersTab } from './CatalogTabs'
import OrdersTab from './OrdersTab'
import PaymentsTab from './PaymentsTab'
import NotificationsTab from './NotificationsTab'
import EnquiriesTab from './EnquiriesTab'
import QuotesTable from '../../components/QuotesTable'

const tabs = [
  { path: 'overview', label: 'Overview', element: <OverviewTab /> },
  { path: 'users', label: 'Users', element: <UsersTab /> },
  { path: 'suppliers', label: 'Suppliers', element: <SuppliersTab /> },
  { path: 'categories', label: 'Categories', element: <CategoriesTab /> },
  { path: 'products', label: 'Products', element: <ProductsTab /> },
  { path: 'quotes', label: 'Quotes', element: <QuotesTable path="/admin/quotes" /> },
  { path: 'orders', label: 'Orders', element: <OrdersTab /> },
  { path: 'enquiries', label: 'Enquiries', element: <EnquiriesTab /> },
  { path: 'payments', label: 'Payments', element: <PaymentsTab /> },
  { path: 'notifications', label: 'Notifications', element: <NotificationsTab /> },
]

export default function AdminPage() {
  const current = useLocation().pathname.split('/')[2] ?? 'overview'
  return (
    <>
      <Tabs value={tabs.some((t) => t.path === current) ? current : 'overview'} variant="scrollable" sx={{ mb: 2 }}>
        {tabs.map((t) => (
          <Tab key={t.path} value={t.path} label={t.label} component={RouterLink} to={`/admin/${t.path}`} />
        ))}
      </Tabs>
      <Box>
        <Routes>
          {tabs.map((t) => (
            <Route key={t.path} path={t.path} element={t.element} />
          ))}
          <Route path="*" element={<Navigate to="overview" replace />} />
        </Routes>
      </Box>
    </>
  )
}
