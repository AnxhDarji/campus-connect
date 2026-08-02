export const USER_ROLES = Object.freeze({
  SUPER_ADMIN: "Super Admin",
  DEPT_ADMIN: "Dept Admin",
  ADMIN: "Admin",
  STUDENT: "Student",
  GUEST: "Guest",
  FACULTY: "Faculty",
  EVENT_MANAGER: "Event Manager",
  CLUB_REPRESENTATIVE: "Club Representative",
  VOLUNTEER_LEAD: "Volunteer Lead",
  MEDIA_TEAM: "Media Team",
});

export const EVENT_AUTHORIZED_ROLES = [
  USER_ROLES.EVENT_MANAGER,
  USER_ROLES.CLUB_REPRESENTATIVE,
  USER_ROLES.VOLUNTEER_LEAD,
  USER_ROLES.MEDIA_TEAM,
];
