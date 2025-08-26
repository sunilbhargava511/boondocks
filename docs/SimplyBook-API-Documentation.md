# SimplyBook.me API Complete Reference

## Overview

The SimplyBook.me API is a JSON-RPC 2.0 protocol-based service that provides comprehensive booking and scheduling functionality for businesses. This document covers ALL available API methods across all service categories.

## API Service Categories

1. **Authentication** - Token management and login methods
2. **Company Public Service** - Public-facing booking and information methods
3. **Company Administration Service** - Management and administrative functions
4. **Catalogue Service** - Directory and search functionality

---

# 🔐 Authentication Service

### Base URLs
- **Login Endpoint**: `https://user-api.simplybook.me/login`
- **Main API Endpoint**: `https://user-api.simplybook.me/`
- **Admin API Endpoint**: `https://user-api.simplybook.me/admin`

## Authentication Methods

### getServiceUrl()
Returns the service URL for the company.
```javascript
var url = loginClient.getServiceUrl(companyLogin);
```

### getToken()
Obtains application token for public service API methods.
```javascript
var loginClient = new JSONRpcClient({
  url: 'https://user-api.simplybook.me/login'
});
var token = loginClient.getToken(companyLogin, apiKey);
```
**Parameters:**
- `companyLogin` (string): Company identifier
- `apiKey` (string): API key from SimplyBook account

### getUserToken()
Obtains user authentication token for administration service API methods.
```javascript
var token = loginClient.getUserToken(companyLogin, userLogin, userPassword);
```
**Parameters:**
- `companyLogin` (string): Company identifier
- `userLogin` (string): User login credentials
- `userPassword` (string): User password

### getApplicationToken()
Gets application-specific authentication token.
```javascript
var appToken = loginClient.getApplicationToken(companyLogin, applicationKey);
```

---

# 🌐 Company Public Service

## 📋 Service & Category Management

### getUnitList()
Retrieves list of service providers/units.
```javascript
var units = client.getUnitList();
```

### getEventList()
Gets list of available services/events.
```javascript
var events = client.getEventList();
```

### getCategoriesList()
Retrieves service categories.
```javascript
var categories = client.getCategoriesList();
```

### getLocationsList()
Gets available service locations.
```javascript
var locations = client.getLocationsList();
```

## 💳 Payment & Cart Management

### getPaymentProcessorConfig()
Retrieves payment processor configuration.
```javascript
var paymentConfig = client.getPaymentProcessorConfig();
```

### validatePayment()
Validates payment information.
```javascript
var isValid = client.validatePayment(paymentData);
```

### getBookingCart()
Gets current booking cart contents.
```javascript
var cart = client.getBookingCart();
```

### getBookingCartInfo()
Retrieves detailed booking cart information.
```javascript
var cartInfo = client.getBookingCartInfo();
```

### getBookingCartStatus()
Gets current status of booking cart.
```javascript
var status = client.getBookingCartStatus();
```

### confirmBookingCart()
Confirms and processes booking cart.
```javascript
var result = client.confirmBookingCart();
```

## 📅 Booking Operations

### confirmBooking()
Confirms a specific booking.
```javascript
var result = client.confirmBooking(bookingId);
```

### confirmBookingPayment()
Confirms payment for booking.
```javascript
var result = client.confirmBookingPayment(bookingId, paymentData);
```

### confirmBookingBatch()
Confirms multiple bookings in batch.
```javascript
var result = client.confirmBookingBatch(bookingIds);
```

### getBooking()
Retrieves booking information.
```javascript
var booking = client.getBooking(bookingId);
```

### getBookingDetails()
Gets detailed booking information.
```javascript
var details = client.getBookingDetails(bookingId);
```

### isPaymentRequired()
Checks if payment is required for booking.
```javascript
var required = client.isPaymentRequired(bookingData);
```

### book()
Creates a new booking.
```javascript
var booking = client.book(serviceId, unitId, clientId, dateTime, additionalFields);
```

### rescheduleBook()
Reschedules an existing booking.
```javascript
var result = client.rescheduleBook(bookingId, newDateTime);
```

## 🔄 Recurring Bookings

### getRecurringDatetimes()
Gets available datetime slots for recurring bookings.
```javascript
var datetimes = client.getRecurringDatetimes(serviceId, unitId, startDate, endDate);
```

## 🎁 Promotions & Discounts

### hasUpcomingPromotions()
Checks if there are upcoming promotions.
```javascript
var hasPromotions = client.hasUpcomingPromotions();
```

### validatePromoCode()
Validates a promotional code.
```javascript
var isValid = client.validatePromoCode(promoCode);
```

### getPromocodeInfo()
Gets information about a specific promo code.
```javascript
var info = client.getPromocodeInfo(promoCode);
```

### getPromotionRewardInfo()
Retrieves promotion reward details.
```javascript
var reward = client.getPromotionRewardInfo(promotionId);
```

### getPluginPromoInfoByCode()
Gets plugin promotion information by code.
```javascript
var info = client.getPluginPromoInfoByCode(promoCode);
```

## 📄 Legal & Content

### getUserLicenseText()
Retrieves user license text.
```javascript
var license = client.getUserLicenseText();
```

### getPrivacyPolicyText()
Gets privacy policy text.
```javascript
var policy = client.getPrivacyPolicyText();
```

## 👤 Client Information

### getClientInfo()
Retrieves client information by ID.
```javascript
var clientInfo = client.getClientInfo(clientId);
```

### getClientInfoByLoginPassword()
Gets client info using login credentials.
```javascript
var clientInfo = client.getClientInfoByLoginPassword(login, password);
```

### remindClientPassword()
Sends password reminder to client.
```javascript
var result = client.remindClientPassword(clientEmail);
```

### getClientByLoginHash()
Retrieves client by login hash.
```javascript
var client = client.getClientByLoginHash(hash);
```

### modifyClientInfo()
Modifies client information.
```javascript
var result = client.modifyClientInfo(clientId, clientData);
```

### getClientBookings()
Gets bookings for a specific client.
```javascript
var bookings = client.getClientBookings(clientId);
```

## 💼 Memberships & Products

### getMembershipList()
Retrieves available memberships.
```javascript
var memberships = client.getMembershipList();
```

### getClientMembershipList()
Gets memberships for specific client.
```javascript
var memberships = client.getClientMembershipList(clientId);
```

### getProductList()
Retrieves available products.
```javascript
var products = client.getProductList();
```

### getClassesList()
Gets available classes.
```javascript
var classes = client.getClassesList();
```

## ⚙️ Company Parameters

### getCompanyParam()
Gets specific company parameter.
```javascript
var param = client.getCompanyParam(paramName);
```

### getCompanyParams()
Retrieves all company parameters.
```javascript
var params = client.getCompanyParams();
```

### getCancellationPolicy()
Gets company cancellation policy.
```javascript
var policy = client.getCancellationPolicy();
```

### getTimelineType()
Retrieves timeline type setting.
```javascript
var type = client.getTimelineType();
```

### getCompanyInfo()
Gets company information.
```javascript
var info = client.getCompanyInfo();
```

### getCompanyTimezoneOffset()
Retrieves company timezone offset.
```javascript
var offset = client.getCompanyTimezoneOffset();
```

## ⏰ Time & Availability

### calculateEndTime()
Calculates appointment end time.
```javascript
var endTime = client.calculateEndTime(serviceId, startTime);
```

### getWorkCalendar()
Gets working calendar.
```javascript
var calendar = client.getWorkCalendar(unitId, month, year);
```

### getReservedTime()
Retrieves reserved time slots.
```javascript
var reserved = client.getReservedTime(unitId, date);
```

### getWorkDaysInfo()
Gets working days information.
```javascript
var workDays = client.getWorkDaysInfo(unitId);
```

### getFirstWorkingDay()
Gets first available working day.
```javascript
var firstDay = client.getFirstWorkingDay();
```

### getStartTimeMatrix()
Retrieves start time matrix.
```javascript
var matrix = client.getStartTimeMatrix(serviceId, unitId, date);
```

### getCartesianStartTimeMatrix()
Gets Cartesian start time matrix.
```javascript
var matrix = client.getCartesianStartTimeMatrix(serviceIds, unitId, date);
```

### getAvailableTimeIntervals()
Gets available time intervals.
```javascript
var intervals = client.getAvailableTimeIntervals(serviceId, unitId, date);
```

### getServiceAvailableTimeIntervals()
Gets service-specific available time intervals.
```javascript
var intervals = client.getServiceAvailableTimeIntervals(serviceId, unitId, date, count);
```

### getReservedTimeIntervals()
Retrieves reserved time intervals.
```javascript
var reserved = client.getReservedTimeIntervals(unitId, date);
```

### getAvailableUnits()
Gets available units for service.
```javascript
var units = client.getAvailableUnits(serviceId, date);
```

### getAnyUnitData()
Retrieves any unit data.
```javascript
var data = client.getAnyUnitData();
```

## 📝 Additional Fields & Forms

### getAdditionalFields()
Gets additional booking fields.
```javascript
var fields = client.getAdditionalFields();
```

### getTimeframe()
Retrieves booking timeframe settings.
```javascript
var timeframe = client.getTimeframe();
```

## 🔌 Plugin Management

### isPluginActivated()
Checks if plugin is activated.
```javascript
var isActive = client.isPluginActivated(pluginName);
```

### getPluginStatuses()
Gets status of all plugins.
```javascript
var statuses = client.getPluginStatuses();
```

## 🚀 Batch Operations

### createBatch()
Creates batch operation.
```javascript
var batch = client.createBatch();
```

## 🌍 Localization

### getCountryPhoneCodes()
Retrieves country phone codes.
```javascript
var codes = client.getCountryPhoneCodes();
```

---

# 🛠️ Company Administration Service

## 👤 User & Phone Validation

### getUserPhoneValidationInfo()
Gets user phone validation information.
```javascript
var info = adminClient.getUserPhoneValidationInfo(userId);
```

## ⚙️ Configuration Management

### saveConfigKeys()
Saves configuration keys.
```javascript
var result = adminClient.saveConfigKeys(configData);
```

### getNotificationConfigStructure()
Gets notification configuration structure.
```javascript
var structure = adminClient.getNotificationConfigStructure();
```

## 📅 Advanced Booking Management

### getBookings()
Retrieves bookings with advanced filtering.
```javascript
var bookings = adminClient.getBookings(filter);
```

### getBookingDetails()
Gets detailed booking information (admin version).
```javascript
var details = adminClient.getBookingDetails(bookingId);
```

### cancelBooking()
Cancels specific booking.
```javascript
var result = adminClient.cancelBooking(bookingId);
```

### cancelBatch()
Cancels multiple bookings.
```javascript
var result = adminClient.cancelBatch(bookingIds);
```

### book()
Creates booking (admin version).
```javascript
var booking = adminClient.book(serviceId, unitId, clientId, dateTime, additionalFields);
```

### editBook()
Edits existing booking.
```javascript
var result = adminClient.editBook(bookingId, bookingData);
```

## 👥 Client Management (Admin)

### addClient()
Adds new client.
```javascript
var clientId = adminClient.addClient(clientData);
```

### editClient()
Edits client information.
```javascript
var result = adminClient.editClient(clientId, clientData);
```

### getClientInfo()
Gets client information (admin version).
```javascript
var info = adminClient.getClientInfo(clientId);
```

### getClientList()
Retrieves client list with filtering.
```javascript
var clients = adminClient.getClientList(filter);
```

### changeClientPassword()
Changes client password.
```javascript
var result = adminClient.changeClientPassword(clientId, newPassword);
```

### resetClientsPassword()
Resets client password.
```javascript
var result = adminClient.resetClientsPassword(clientEmail);
```

### remindClientsPassword()
Sends password reminder to clients.
```javascript
var result = adminClient.remindClientsPassword(clientEmails);
```

## 📊 Status Management

### getStatuses()
Retrieves all booking statuses.
```javascript
var statuses = adminClient.getStatuses();
```

### getBookingStatus()
Gets specific booking status.
```javascript
var status = adminClient.getBookingStatus(bookingId);
```

### setStatus()
Sets booking status.
```javascript
var result = adminClient.setStatus(bookingId, statusId);
```

## 🔄 Recurring Bookings (Admin)

### getRecurringSettings()
Gets recurring booking settings.
```javascript
var settings = adminClient.getRecurringSettings();
```

### getRecurringDatetimes()
Gets recurring booking datetimes (admin version).
```javascript
var datetimes = adminClient.getRecurringDatetimes(serviceId, unitId, startDate, endDate);
```

## 📈 Analytics & Performance

### getTopServices()
Gets top performing services.
```javascript
var services = adminClient.getTopServices(startDate, endDate);
```

### getTopPerformers()
Gets top performing providers.
```javascript
var performers = adminClient.getTopPerformers(startDate, endDate);
```

### getBookingStats()
Retrieves booking statistics.
```javascript
var stats = adminClient.getBookingStats(startDate, endDate);
```

### getVisitorStats()
Gets visitor statistics.
```javascript
var visitors = adminClient.getVisitorStats(startDate, endDate);
```

### getSocialCounterStats()
Retrieves social counter statistics.
```javascript
var social = adminClient.getSocialCounterStats();
```

### getWorkload()
Gets provider workload analysis.
```javascript
var workload = adminClient.getWorkload(unitId, startDate, endDate);
```

### getBookingRevenue()
Retrieves booking revenue information.
```javascript
var revenue = adminClient.getBookingRevenue(startDate, endDate);
```

## 🌍 Location & Country Data

### getCountryList()
Gets list of countries.
```javascript
var countries = adminClient.getCountryList();
```

### getStates()
Retrieves states/provinces for country.
```javascript
var states = adminClient.getStates(countryId);
```

## 💬 Feedback & Reviews

### getFeedbacks()
Gets customer feedback.
```javascript
var feedback = adminClient.getFeedbacks(filter);
```

### getRecentActions()
Retrieves recent system actions.
```javascript
var actions = adminClient.getRecentActions();
```

### getWarnings()
Gets system warnings.
```javascript
var warnings = adminClient.getWarnings();
```

## 🔔 Notifications

### updateNotification()
Updates notification settings.
```javascript
var result = adminClient.updateNotification(notificationData);
```

### getLastNotificationUpdate()
Gets last notification update timestamp.
```javascript
var timestamp = adminClient.getLastNotificationUpdate();
```

### getBookingCancellationsInfo()
Gets booking cancellation information.
```javascript
var info = adminClient.getBookingCancellationsInfo();
```

## ✅ Approval Plugin

### pluginApproveBookingApprove()
Approves pending booking.
```javascript
var result = adminClient.pluginApproveBookingApprove(bookingId);
```

### pluginApproveBookingCancel()
Cancels pending booking approval.
```javascript
var result = adminClient.pluginApproveBookingCancel(bookingId);
```

### pluginApproveGetPendingBookingsCount()
Gets count of pending approvals.
```javascript
var count = adminClient.pluginApproveGetPendingBookingsCount();
```

### pluginApproveGetPendingBookings()
Gets pending booking approvals.
```javascript
var bookings = adminClient.pluginApproveGetPendingBookings();
```

## 🔌 Plugin Management (Admin)

### getPluginList()
Gets available plugins.
```javascript
var plugins = adminClient.getPluginList();
```

## 💬 Booking Comments

### getBookingComment()
Gets booking comment.
```javascript
var comment = adminClient.getBookingComment(bookingId);
```

### setBookingComment()
Sets booking comment.
```javascript
var result = adminClient.setBookingComment(bookingId, comment);
```

## 💰 Billing & Tariff

### getCurrentTariffInfo()
Gets current tariff information.
```javascript
var tariff = adminClient.getCurrentTariffInfo();
```

### getRegistrations()
Gets registration information.
```javascript
var registrations = adminClient.getRegistrations();
```

## 💱 Currency

### getCompanyCurrency()
Gets company currency settings.
```javascript
var currency = adminClient.getCompanyCurrency();
```

## 👤 Client Comments & SOAP Notes

### getClientComments()
Gets client comments.
```javascript
var comments = adminClient.getClientComments(clientId);
```

### getClientSoapData()
Gets client SOAP notes data.
```javascript
var soap = adminClient.getClientSoapData(clientId);
```

### getClientSoapHistory()
Gets client SOAP notes history.
```javascript
var history = adminClient.getClientSoapHistory(clientId);
```

### getClientSoapCryptData()
Gets encrypted client SOAP data.
```javascript
var data = adminClient.getClientSoapCryptData(clientId);
```

### getClientSoapCryptHistory()
Gets encrypted client SOAP history.
```javascript
var history = adminClient.getClientSoapCryptHistory(clientId);
```

## 👤 User Management

### getCurrentUserDetails()
Gets current user details.
```javascript
var user = adminClient.getCurrentUserDetails();
```

## 📋 Categories & Locations (Admin)

### getCategoriesList()
Gets service categories (admin version).
```javascript
var categories = adminClient.getCategoriesList();
```

### getLocationsList()
Gets service locations (admin version).
```javascript
var locations = adminClient.getLocationsList();
```

## 💳 Membership Management

### getMembership()
Gets membership information.
```javascript
var membership = adminClient.getMembership(membershipId);
```

### getClientMembershipList()
Gets client membership list (admin version).
```javascript
var memberships = adminClient.getClientMembershipList(clientId);
```

## 🏗️ Work Schedule Management

### getUnitWorkdayInfo()
Gets unit working day information.
```javascript
var workday = adminClient.getUnitWorkdayInfo(unitId);
```

### setWorkDayInfo()
Sets working day information.
```javascript
var result = adminClient.setWorkDayInfo(unitId, workdayData);
```

### deleteSpecialDay()
Deletes special day configuration.
```javascript
var result = adminClient.deleteSpecialDay(specialDayId);
```

### getWorkDaysTimes()
Gets working day times.
```javascript
var times = adminClient.getWorkDaysTimes(unitId);
```

### getUnitWorkingDurations()
Gets unit working durations.
```javascript
var durations = adminClient.getUnitWorkingDurations(unitId);
```

## 📅 Calendar Management

### getCompanyWorkCalendarForYear()
Gets company work calendar for year.
```javascript
var calendar = adminClient.getCompanyWorkCalendarForYear(year);
```

### getServiceWorkCalendarForYear()
Gets service work calendar for year.
```javascript
var calendar = adminClient.getServiceWorkCalendarForYear(serviceId, year);
```

## 🏖️ Vacation Management

### getCompanyVacations()
Gets company vacation periods.
```javascript
var vacations = adminClient.getCompanyVacations();
```

### getServiceVacations()
Gets service-specific vacations.
```javascript
var vacations = adminClient.getServiceVacations(serviceId);
```

### getPerformerVacations()
Gets performer vacation periods.
```javascript
var vacations = adminClient.getPerformerVacations(unitId);
```

### getCompanyVacation()
Gets specific company vacation.
```javascript
var vacation = adminClient.getCompanyVacation(vacationId);
```

### getServiceVacation()
Gets specific service vacation.
```javascript
var vacation = adminClient.getServiceVacation(vacationId);
```

### getPerformerVacation()
Gets specific performer vacation.
```javascript
var vacation = adminClient.getPerformerVacation(vacationId);
```

### saveCompanyVacation()
Saves company vacation period.
```javascript
var result = adminClient.saveCompanyVacation(vacationData);
```

### saveServiceVacation()
Saves service vacation period.
```javascript
var result = adminClient.saveServiceVacation(serviceId, vacationData);
```

### savePerformerVacation()
Saves performer vacation period.
```javascript
var result = adminClient.savePerformerVacation(unitId, vacationData);
```

### deleteCompanyVacation()
Deletes company vacation.
```javascript
var result = adminClient.deleteCompanyVacation(vacationId);
```

### deleteServiceVacation()
Deletes service vacation.
```javascript
var result = adminClient.deleteServiceVacation(vacationId);
```

### deletePerformerVacation()
Deletes performer vacation.
```javascript
var result = adminClient.deletePerformerVacation(vacationId);
```

## 🎓 Classes & Products (Admin)

### getClassesList()
Gets available classes (admin version).
```javascript
var classes = adminClient.getClassesList();
```

### getProductList()
Gets available products (admin version).
```javascript
var products = adminClient.getProductList();
```

## 📊 Advanced Reports

### getBookingReport()
Generates comprehensive booking report.
```javascript
var report = adminClient.getBookingReport(startDate, endDate, filter);
```

### getClientReport()
Generates client activity report.
```javascript
var report = adminClient.getClientReport(startDate, endDate);
```

### getSmsReport()
Generates SMS usage report.
```javascript
var report = adminClient.getSmsReport(startDate, endDate);
```

### getEmailReport()
Generates email activity report.
```javascript
var report = adminClient.getEmailReport(startDate, endDate);
```

### getPosReport()
Generates POS system report.
```javascript
var report = adminClient.getPosReport(startDate, endDate);
```

### getFeedbackReport()
Generates feedback report.
```javascript
var report = adminClient.getFeedbackReport(startDate, endDate);
```

## 📱 SMS Management

### getSmsGateways()
Gets available SMS gateways.
```javascript
var gateways = adminClient.getSmsGateways();
```

## 🎁 Promotion Management (Admin)

### getPromotionList()
Gets promotion list (admin version).
```javascript
var promotions = adminClient.getPromotionList();
```

### getPromotionInstanceList()
Gets promotion instance list.
```javascript
var instances = adminClient.getPromotionInstanceList();
```

### getPromotionDetails()
Gets detailed promotion information.
```javascript
var details = adminClient.getPromotionDetails(promotionId);
```

## 📄 Static Pages

### getStaticPageList()
Gets static page list.
```javascript
var pages = adminClient.getStaticPageList();
```

## 💳 Financial Operations

### confirmInvoice()
Confirms invoice payment.
```javascript
var result = adminClient.confirmInvoice(invoiceId);
```

### applyPromoCode()
Applies promo code to booking.
```javascript
var result = adminClient.applyPromoCode(bookingId, promoCode);
```

### applyTip()
Applies tip to booking.
```javascript
var result = adminClient.applyTip(bookingId, tipAmount);
```

## 📊 Channel Analytics

### getCountBySchedulerChannels()
Gets booking count by scheduler channels.
```javascript
var count = adminClient.getCountBySchedulerChannels();
```

## 📅 Google Calendar Integration

### getGoogleCalendarBusyTime()
Gets Google Calendar busy times.
```javascript
var busyTimes = adminClient.getGoogleCalendarBusyTime(unitId, startDate, endDate);
```

### getGoogleCalendarBusyTimeAvailableUnits()
Gets available units considering Google Calendar.
```javascript
var units = adminClient.getGoogleCalendarBusyTimeAvailableUnits(serviceId, date);
```

## ⏰ Booking Limits

### getBookingLimitUnavailableTimeInterval()
Gets unavailable time intervals due to booking limits.
```javascript
var intervals = adminClient.getBookingLimitUnavailableTimeInterval(serviceId, date);
```

## 🔌 Zapier Integration

### pluginZapierSubscribe()
Subscribes to Zapier webhooks.
```javascript
var result = adminClient.pluginZapierSubscribe(webhookData);
```

### getBookingDetailsZapierMock()
Gets booking details for Zapier testing.
```javascript
var mock = adminClient.getBookingDetailsZapierMock();
```

### getClientInfoZapier()
Gets client info for Zapier integration.
```javascript
var info = adminClient.getClientInfoZapier(clientId);
```

### getClientInfoZapierMock()
Gets client info mock for Zapier testing.
```javascript
var mock = adminClient.getClientInfoZapierMock();
```

### getBookingsZapier()
Gets bookings for Zapier integration.
```javascript
var bookings = adminClient.getBookingsZapier(filter);
```

### getInvoiceDetailsMock()
Gets invoice details mock data.
```javascript
var mock = adminClient.getInvoiceDetailsMock();
```

---

# 📁 Catalogue Service

## 🏢 Company Directory

### getCompanyList()
Retrieves list of companies in directory.
```javascript
var companies = catalogueClient.getCompanyList(filter);
```

### getCompanyCount()
Gets total count of companies.
```javascript
var count = catalogueClient.getCompanyCount();
```

### getCompanyInfo()
Gets detailed company information.
```javascript
var info = catalogueClient.getCompanyInfo(companyId);
```

### getRecentCompanies()
Gets recently added companies.
```javascript
var recent = catalogueClient.getRecentCompanies();
```

## 🎁 Promotion Directory

### getPromotionList()
Gets list of promotions.
```javascript
var promotions = catalogueClient.getPromotionList(filter);
```

### getPromotionListByIds()
Gets promotions by specific IDs.
```javascript
var promotions = catalogueClient.getPromotionListByIds(promotionIds);
```

### getPromotionCount()
Gets total promotion count.
```javascript
var count = catalogueClient.getPromotionCount();
```

### getPromotionInfo()
Gets detailed promotion information.
```javascript
var info = catalogueClient.getPromotionInfo(promotionId);
```

### getRelatedPromotions()
Gets related promotions.
```javascript
var related = catalogueClient.getRelatedPromotions(promotionId);
```

### getRecentPromotions()
Gets recently added promotions.
```javascript
var recent = catalogueClient.getRecentPromotions();
```

### getCompanyPromotionList()
Gets promotions for specific company.
```javascript
var promotions = catalogueClient.getCompanyPromotionList(companyId);
```

## 🌍 Geographic Data

### getTopCountries()
Gets most popular countries.
```javascript
var countries = catalogueClient.getTopCountries();
```

### getTopCities()
Gets most popular cities.
```javascript
var cities = catalogueClient.getTopCities();
```

### getCountries()
Gets all available countries.
```javascript
var countries = catalogueClient.getCountries();
```

### getCities()
Gets cities for specific country.
```javascript
var cities = catalogueClient.getCities(countryId);
```

### getUserLocation()
Gets user's current location.
```javascript
var location = catalogueClient.getUserLocation();
```

## 🏷️ Tags & Categories

### getTags()
Gets available service tags.
```javascript
var tags = catalogueClient.getTags();
```

### getCategories()
Gets service categories.
```javascript
var categories = catalogueClient.getCategories();
```

## ⭐ Reviews & Ratings

### getCompanyReviews()
Gets reviews for specific company.
```javascript
var reviews = catalogueClient.getCompanyReviews(companyId);
```

### getCompanyReviewsCount()
Gets count of company reviews.
```javascript
var count = catalogueClient.getCompanyReviewsCount(companyId);
```

### getCompanyReview()
Gets specific company review.
```javascript
var review = catalogueClient.getCompanyReview(reviewId);
```

### getClientReviewsLikes()
Gets client review likes.
```javascript
var likes = catalogueClient.getClientReviewsLikes(clientId);
```

### addCompanyReview()
Adds review for company.
```javascript
var result = catalogueClient.addCompanyReview(companyId, reviewData);
```

### addPromotionReview()
Adds review for promotion.
```javascript
var result = catalogueClient.addPromotionReview(promotionId, reviewData);
```

### getPromotionReviews()
Gets promotion reviews.
```javascript
var reviews = catalogueClient.getPromotionReviews(promotionId);
```

## 💬 Feedback Management

### getRecentFeedbacks()
Gets recent customer feedback.
```javascript
var feedback = catalogueClient.getRecentFeedbacks();
```

### getFeedbackList()
Gets filtered feedback list.
```javascript
var feedback = catalogueClient.getFeedbackList(filter);
```

### deleteClientFeedbacks()
Deletes client feedback.
```javascript
var result = catalogueClient.deleteClientFeedbacks(clientId);
```

### deleteClientPromotionFeedbacks()
Deletes client promotion feedback.
```javascript
var result = catalogueClient.deleteClientPromotionFeedbacks(clientId, promotionId);
```

## 🔍 Search & Autocomplete

### getAutocompleete()
Gets autocomplete suggestions.
```javascript
var suggestions = catalogueClient.getAutocompleete(query);
```

---

# 🚀 Usage Examples

## Complete Booking Flow
```javascript
// 1. Authentication
var loginClient = new JSONRpcClient({
  url: 'https://user-api.simplybook.me/login'
});
var token = loginClient.getToken('your-company', 'your-api-key');

// 2. Initialize main client
var client = new JSONRpcClient({
  url: 'https://user-api.simplybook.me/',
  headers: {
    'X-Company-Login': 'your-company',
    'X-Token': token
  }
});

// 3. Get available services
var services = client.getEventList();

// 4. Get available providers
var providers = client.getUnitList();

// 5. Check availability
var availability = client.getAvailableTimeIntervals(serviceId, unitId, date);

// 6. Create client if needed
var clientId = client.addClient({
  name: 'John Doe',
  email: 'john@example.com',
  phone: '+1234567890'
});

// 7. Book appointment
var booking = client.book(serviceId, unitId, clientId, dateTime);
```

## Admin Dashboard Setup
```javascript
// 1. Get admin token
var adminToken = loginClient.getUserToken('company', 'admin', 'password');

// 2. Initialize admin client
var adminClient = new JSONRpcClient({
  url: 'https://user-api.simplybook.me/admin',
  headers: {
    'X-Company-Login': 'company',
    'X-Token': adminToken
  }
});

// 3. Get business analytics
var stats = adminClient.getBookingStats(startDate, endDate);
var topServices = adminClient.getTopServices(startDate, endDate);
var revenue = adminClient.getBookingRevenue(startDate, endDate);
```

## Error Handling
```javascript
try {
  var result = client.book(serviceId, unitId, clientId, dateTime);
  if (result.error) {
    console.error('Booking failed:', result.error);
  } else {
    console.log('Booking successful:', result);
  }
} catch (error) {
  console.error('API call failed:', error);
}
```

---

# 📋 Integration Checklist

## Essential Setup
- [ ] Obtain API credentials from SimplyBook.me account
- [ ] Test authentication with `getToken()` and `getUserToken()`
- [ ] Verify company information with `getCompanyInfo()`
- [ ] Test basic booking flow with `book()` method

## Production Requirements
1. **Rate Limiting**: Implement proper rate limiting
2. **Error Handling**: Handle all API errors gracefully
3. **Date Formats**: Use ISO 8601 format (YYYY-MM-DD)
4. **Time Zones**: Account for company timezone settings
5. **Testing**: Test all integrations in sandbox environment
6. **Security**: Never expose API keys in client-side code
7. **Logging**: Implement comprehensive API call logging
8. **Caching**: Cache static data like services and providers

## Advanced Features
- [ ] Implement recurring booking management
- [ ] Set up promotion and discount handling
- [ ] Configure notification systems
- [ ] Integrate payment processing
- [ ] Set up analytics and reporting
- [ ] Implement multi-location support

---

# 📚 Additional Resources

- **Official Documentation**: [SimplyBook.me API Docs](https://simplybook.me/en/api/developer-api/)
- **JSON-RPC 2.0 Spec**: [JSON-RPC 2.0](https://www.jsonrpc.org/specification)
- **Support**: support@simplybook.me
- **Developer Forum**: [Community Support](https://simplybook.me/en/community/)

---

*This comprehensive documentation covers all 200+ SimplyBook.me API methods across Authentication, Public Service, Administration, and Catalogue services. Last updated: 2025*