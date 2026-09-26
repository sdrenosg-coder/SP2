<Route path="/manage/:token" element={<ManageBookingPage />} />
<Route path="/gift-cards" element={<ProtectedRoute><GiftCardsPage /></ProtectedRoute>} />
<Route path="/audit" element={<ProtectedRoute><AuditLogPage /></ProtectedRoute>} />
