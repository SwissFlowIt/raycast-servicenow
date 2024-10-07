interface Preferences {
  instance: string;
  token: string;
}

interface Workspace {
  sys_id: string;
  u_icon: string;
  u_name: string;
  u_description: string;
  u_active: string;
  sys_updated_on: string;
  sys_created_by: string;
  sys_created_on: string;
  sys_updated_by: string;
}

interface Page {
  sys_id: string;
  u_title: string;
  u_subtitle: string;
  u_icon: string;
  u_workspace: string;
  u_cover_photo: string;
  u_content: string;
  u_show_cover_photo: string;
  u_show_subtitle: string;
  u_show_authors: string;
  u_show_last_edited: string;
  u_show_outline: string;
  u_show_subpages: string;
  u_show_previous_and_next: string;
  u_font_size: string;
  u_font_type: string;
  u_width: string;
  u_alignment: string;
  sys_updated_on: string;
  sys_created_by: string;
  sys_created_on: string;
  sys_updated_by: string;
}
/* interface LaunchArguments {
  query: string;
} */

export type { Preferences, Workspace, Page };
