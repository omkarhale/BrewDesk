package com.office.brewdesk.attendance.service;

import com.office.brewdesk.attendance.dto.RejectRegularizationRequest;
import com.office.brewdesk.attendance.dto.SubmitRegularizationRequest;
import com.office.brewdesk.attendance.entity.*;
import com.office.brewdesk.attendance.enums.*;
import com.office.brewdesk.attendance.repository.*;
import com.office.brewdesk.entity.User;
import com.office.brewdesk.enums.Role;
import com.office.brewdesk.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Unit tests for {@link RegularizationService}.
 *
 * Covers:
 *  - submit: happy path, future date rejected, duplicate rejected,
 *    inactive employee rejected, type-specific field validation
 *  - cancel: owner only, PENDING only
 *  - approve: canActOn gate (manager ✓, admin ✓, own request ✗, other ✗),
 *    status transition PENDING→APPROVED only
 *  - reject: same gate as approve, rejectionReason stored
 *  - getById: owner ✓, manager ✓, admin ✓, stranger ✗
 *  - AttendanceCorrectionService integration: called on approve, NOT on reject
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RegularizationServiceTest {

    // ── Mocks ────────────────────────────────────────────────────────────────

    @Mock RegularizationRequestRepository  requestRepository;
    @Mock RegularizationAttachmentRepository attachmentRepository;
    @Mock EmployeeProfileRepository          employeeProfileRepository;
    @Mock AttendanceRecordRepository         attendanceRecordRepository;
    @Mock UserRepository                     userRepository;
    @Mock AttendanceCalculationService       calculationService;
    @Mock AttendanceCorrectionService        correctionService;

    @InjectMocks
    RegularizationService service;

    // ── Fixtures ─────────────────────────────────────────────────────────────

    private User         employeeUser;
    private User         managerUser;
    private User         adminUser;
    private User         strangerUser;
    private EmployeeProfile employeeProfile;
    private Shift        shift;

    @BeforeEach
    void setUp() {
        employeeUser  = user(1L, "emp@test.com",    Role.EMPLOYEE);
        managerUser   = user(2L, "mgr@test.com",    Role.REPORTING_MANAGER);
        adminUser     = user(3L, "admin@test.com",  Role.ADMIN);
        strangerUser  = user(4L, "other@test.com",  Role.EMPLOYEE);

        shift = Shift.builder()
                .id(10L)
                .name("Day")
                .startTime(LocalTime.of(9, 0))
                .endTime(LocalTime.of(18, 0))
                .graceMinutes(15)
                .minimumWorkMinutes(480)
                .halfDayMinutes(240)
                .active(true)
                .build();

        employeeProfile = EmployeeProfile.builder()
                .id(100L)
                .user(employeeUser)
                .employeeCode("EMP001")
                .shift(shift)
                .manager(managerUser)
                .joiningDate(LocalDate.of(2024, 1, 1))
                .active(true)
                .build();

        // Wire setter injection
        service.setCorrectionService(correctionService);
    }

    // ── submit ────────────────────────────────────────────────────────────────

    @Test
    void submit_happyPath_savesAndReturnsResponse() {
        mockCurrentUser(employeeUser);
        when(employeeProfileRepository.findByUser(employeeUser))
                .thenReturn(Optional.of(employeeProfile));
        when(attendanceRecordRepository.findByEmployeeIdAndAttendanceDate(any(), any()))
                .thenReturn(Optional.empty());
        when(requestRepository.existsByEmployeeIdAndAttendanceDateAndTypeAndStatusIn(
                any(), any(), any(), any())).thenReturn(false);

        RegularizationRequest saved = pendingRequest(1L, employeeProfile);
        when(requestRepository.save(any())).thenReturn(saved);
        lenientAttachmentCounts(List.of(saved));

        // LATE_ARRIVAL requires requestedPunchIn
        LocalDateTime punchIn = LocalDate.now().minusDays(1)
                .atTime(9, 30);
        var req = submitRequest(LocalDate.now().minusDays(1),
                RegularizationType.LATE_ARRIVAL, punchIn, null, null);

        var result = service.submit(req);
        assertThat(result).isNotNull();
        assertThat(result.getStatus()).isEqualTo(RegularizationStatus.PENDING);
        verify(requestRepository).save(any());
    }

    @Test
    void submit_futureDate_throws() {
        mockCurrentUser(employeeUser);
        when(employeeProfileRepository.findByUser(employeeUser))
                .thenReturn(Optional.of(employeeProfile));

        var req = submitRequest(LocalDate.now().plusDays(1),
                RegularizationType.LATE_ARRIVAL, null, null, null);

        assertThatThrownBy(() -> service.submit(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("future");
    }

    @Test
    void submit_inactiveEmployee_throws() {
        employeeProfile.setActive(false);
        mockCurrentUser(employeeUser);
        when(employeeProfileRepository.findByUser(employeeUser))
                .thenReturn(Optional.of(employeeProfile));

        var req = submitRequest(LocalDate.now().minusDays(1),
                RegularizationType.LATE_ARRIVAL, null, null, null);

        assertThatThrownBy(() -> service.submit(req))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("nactive");
    }

    @Test
    void submit_duplicate_throws() {
        mockCurrentUser(employeeUser);
        when(employeeProfileRepository.findByUser(employeeUser))
                .thenReturn(Optional.of(employeeProfile));
        when(requestRepository.existsByEmployeeIdAndAttendanceDateAndTypeAndStatusIn(
                any(), any(), any(), any())).thenReturn(true);

        var req = submitRequest(LocalDate.now().minusDays(1),
                RegularizationType.LATE_ARRIVAL, null, null, null);

        assertThatThrownBy(() -> service.submit(req))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("pending or approved");
    }

    @Test
    void submit_missedPunch_neitherInNorOut_throws() {
        mockCurrentUser(employeeUser);
        when(employeeProfileRepository.findByUser(employeeUser))
                .thenReturn(Optional.of(employeeProfile));

        var req = submitRequest(LocalDate.now().minusDays(1),
                RegularizationType.MISSED_PUNCH, null, null, null);

        assertThatThrownBy(() -> service.submit(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("MISSED_PUNCH");
    }

    @Test
    void submit_halfDay_noHalfDayType_throws() {
        mockCurrentUser(employeeUser);
        when(employeeProfileRepository.findByUser(employeeUser))
                .thenReturn(Optional.of(employeeProfile));

        var req = submitRequest(LocalDate.now().minusDays(1),
                RegularizationType.HALF_DAY, null, null, null);

        assertThatThrownBy(() -> service.submit(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("HALF_DAY");
    }

    @Test
    void submit_halfDayTypeOnNonHalfDay_throws() {
        mockCurrentUser(employeeUser);
        when(employeeProfileRepository.findByUser(employeeUser))
                .thenReturn(Optional.of(employeeProfile));

        var req = submitRequest(LocalDate.now().minusDays(1),
                RegularizationType.LATE_ARRIVAL, null, null, HalfDayType.FIRST_HALF);

        assertThatThrownBy(() -> service.submit(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("halfDayType");
    }

    @Test
    void submit_punchOutBeforePunchIn_throws() {
        mockCurrentUser(employeeUser);
        when(employeeProfileRepository.findByUser(employeeUser))
                .thenReturn(Optional.of(employeeProfile));

        LocalDateTime inTime  = LocalDateTime.now().withHour(10).withMinute(0);
        LocalDateTime outTime = LocalDateTime.now().withHour(9).withMinute(0);

        var req = submitRequest(LocalDate.now().minusDays(1),
                RegularizationType.INCORRECT_PUNCH, inTime, outTime, null);

        assertThatThrownBy(() -> service.submit(req))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("after");
    }

    // ── cancel ────────────────────────────────────────────────────────────────

    @Test
    void cancel_owner_pendingRequest_succeeds() {
        mockCurrentUser(employeeUser);
        when(employeeProfileRepository.findByUser(employeeUser))
                .thenReturn(Optional.of(employeeProfile));

        RegularizationRequest req = pendingRequest(1L, employeeProfile);
        when(requestRepository.findByIdAndEmployeeId(1L, 100L))
                .thenReturn(Optional.of(req));
        when(requestRepository.save(any())).thenReturn(req);
        lenientAttachmentCounts(List.of(req));

        service.cancel(1L);
        assertThat(req.getStatus()).isEqualTo(RegularizationStatus.CANCELLED);
    }

    @Test
    void cancel_notOwner_throws() {
        mockCurrentUser(strangerUser);
        when(userRepository.findByEmail("other@test.com"))
                .thenReturn(Optional.of(strangerUser));
        when(employeeProfileRepository.findByUser(strangerUser))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.cancel(1L))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void cancel_alreadyApproved_throws() {
        mockCurrentUser(employeeUser);
        when(employeeProfileRepository.findByUser(employeeUser))
                .thenReturn(Optional.of(employeeProfile));

        RegularizationRequest req = pendingRequest(1L, employeeProfile);
        req.setStatus(RegularizationStatus.APPROVED);
        when(requestRepository.findByIdAndEmployeeId(1L, 100L))
                .thenReturn(Optional.of(req));

        assertThatThrownBy(() -> service.cancel(1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("PENDING");
    }

    // ── approve ───────────────────────────────────────────────────────────────

    @Test
    void approve_byManager_succeeds_andTriggersCorrectionService() {
        mockCurrentUser(managerUser);
        RegularizationRequest req = pendingRequest(1L, employeeProfile);
        when(requestRepository.findById(1L)).thenReturn(Optional.of(req));
        when(requestRepository.save(any())).thenReturn(req);
        mockAttachmentCounts(List.of(req));

        service.approve(1L);

        assertThat(req.getStatus()).isEqualTo(RegularizationStatus.APPROVED);
        assertThat(req.getReviewedBy()).isEqualTo(managerUser);
        verify(correctionService).applyCorrection(req);
    }

    @Test
    void approve_byAdmin_succeeds() {
        mockCurrentUser(adminUser);
        RegularizationRequest req = pendingRequest(1L, employeeProfile);
        when(requestRepository.findById(1L)).thenReturn(Optional.of(req));
        when(requestRepository.save(any())).thenReturn(req);
        mockAttachmentCounts(List.of(req));

        service.approve(1L);

        assertThat(req.getStatus()).isEqualTo(RegularizationStatus.APPROVED);
        verify(correctionService).applyCorrection(req);
    }

    @Test
    void approve_byOwnEmployee_throws() {
        mockCurrentUser(employeeUser);
        RegularizationRequest req = pendingRequest(1L, employeeProfile);
        when(requestRepository.findById(1L)).thenReturn(Optional.of(req));

        assertThatThrownBy(() -> service.approve(1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not authorized");

        verify(correctionService, never()).applyCorrection(any());
    }

    @Test
    void approve_byStranger_throws() {
        // strangerUser is EMPLOYEE and not the manager
        mockCurrentUser(strangerUser);
        RegularizationRequest req = pendingRequest(1L, employeeProfile);
        when(requestRepository.findById(1L)).thenReturn(Optional.of(req));

        assertThatThrownBy(() -> service.approve(1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not authorized");

        verify(correctionService, never()).applyCorrection(any());
    }

    @Test
    void approve_alreadyApproved_throws() {
        mockCurrentUser(managerUser);
        RegularizationRequest req = pendingRequest(1L, employeeProfile);
        req.setStatus(RegularizationStatus.APPROVED);
        when(requestRepository.findById(1L)).thenReturn(Optional.of(req));

        assertThatThrownBy(() -> service.approve(1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("PENDING");

        verify(correctionService, never()).applyCorrection(any());
    }

    // ── reject ────────────────────────────────────────────────────────────────

    @Test
    void reject_byManager_storesReasonAndDoesNotTriggerCorrection() {
        mockCurrentUser(managerUser);
        RegularizationRequest req = pendingRequest(1L, employeeProfile);
        when(requestRepository.findById(1L)).thenReturn(Optional.of(req));
        when(requestRepository.save(any())).thenReturn(req);
        mockAttachmentCounts(List.of(req));

        RejectRegularizationRequest dto = new RejectRegularizationRequest();
        dto.setRejectionReason("Cannot verify the timing");
        service.reject(1L, dto);

        assertThat(req.getStatus()).isEqualTo(RegularizationStatus.REJECTED);
        assertThat(req.getRejectionReason()).isEqualTo("Cannot verify the timing");
        verify(correctionService, never()).applyCorrection(any());
    }

    @Test
    void reject_byOwnEmployee_throws() {
        mockCurrentUser(employeeUser);
        RegularizationRequest req = pendingRequest(1L, employeeProfile);
        when(requestRepository.findById(1L)).thenReturn(Optional.of(req));

        RejectRegularizationRequest dto = new RejectRegularizationRequest();
        dto.setRejectionReason("Try to self-reject");

        assertThatThrownBy(() -> service.reject(1L, dto))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("not authorized");
    }

    // ── getById scope ─────────────────────────────────────────────────────────

    @Test
    void getById_byOwner_succeeds() {
        mockCurrentUser(employeeUser);
        RegularizationRequest req = pendingRequest(1L, employeeProfile);
        when(requestRepository.findById(1L)).thenReturn(Optional.of(req));

        assertThatNoException().isThrownBy(() -> service.getById(1L));
    }

    @Test
    void getById_byManager_succeeds() {
        mockCurrentUser(managerUser);
        RegularizationRequest req = pendingRequest(1L, employeeProfile);
        when(requestRepository.findById(1L)).thenReturn(Optional.of(req));

        assertThatNoException().isThrownBy(() -> service.getById(1L));
    }

    @Test
    void getById_byAdmin_succeeds() {
        mockCurrentUser(adminUser);
        RegularizationRequest req = pendingRequest(1L, employeeProfile);
        when(requestRepository.findById(1L)).thenReturn(Optional.of(req));

        assertThatNoException().isThrownBy(() -> service.getById(1L));
    }

    @Test
    void getById_byStranger_throws() {
        mockCurrentUser(strangerUser);
        RegularizationRequest req = pendingRequest(1L, employeeProfile);
        when(requestRepository.findById(1L)).thenReturn(Optional.of(req));

        assertThatThrownBy(() -> service.getById(1L))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("not found");
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private void mockCurrentUser(User u) {
        Authentication auth = mock(Authentication.class);
        when(auth.getName()).thenReturn(u.getEmail());
        SecurityContext ctx = mock(SecurityContext.class);
        when(ctx.getAuthentication()).thenReturn(auth);
        SecurityContextHolder.setContext(ctx);
        when(userRepository.findByEmail(u.getEmail())).thenReturn(Optional.of(u));
    }

    private static User user(Long id, String email, Role role) {
        return User.builder().id(id).name("User " + id)
                .email(email).password("pw").role(role).active(true).build();
    }

    private static RegularizationRequest pendingRequest(
            Long id, EmployeeProfile emp) {
        RegularizationRequest r = RegularizationRequest.builder()
                .employee(emp)
                .attendanceDate(LocalDate.now().minusDays(1))
                .type(RegularizationType.LATE_ARRIVAL)
                .requestedPunchIn(
                        LocalDateTime.now().minusDays(1).withHour(9).withMinute(30))
                .reason("Test reason for regularization")
                .status(RegularizationStatus.PENDING)
                .build();
        // Reflect id via field — avoids needing DB
        try {
            var f = r.getClass().getDeclaredField("id");
            f.setAccessible(true);
            f.set(r, id);
        } catch (Exception ignored) {}
        return r;
    }

    private SubmitRegularizationRequest submitRequest(
            LocalDate date,
            RegularizationType type,
            LocalDateTime punchIn,
            LocalDateTime punchOut,
            HalfDayType halfDay) {

        SubmitRegularizationRequest req = new SubmitRegularizationRequest();
        req.setAttendanceDate(date);
        req.setType(type);
        req.setRequestedPunchIn(punchIn);
        req.setRequestedPunchOut(punchOut);
        req.setHalfDayType(halfDay);
        req.setReason("Test reason long enough");
        return req;
    }

    /**
     * Stub the countByRequestIdsGrouped call used in toPage() to avoid NPE
     * when the service builds the page response from mocked request lists.
     */
    private void mockAttachmentCounts(List<RegularizationRequest> requests) {
        when(attachmentRepository.countByRequestIdsGrouped(any()))
                .thenReturn(List.of());
    }
}
