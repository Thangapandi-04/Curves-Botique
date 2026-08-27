export const slugify = (text) => text.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
export const orderCode = () => `CURVE-${Date.now().toString().slice(-8)}-${Math.floor(Math.random()*90+10)}`;
export const applicationCode = () => `APP-${Date.now().toString().slice(-8)}`;
export const publicUser = u => ({id:u.id,fullName:u.full_name,email:u.email,mobile:u.mobile,role:u.role,dateOfBirth:u.date_of_birth,gender:u.gender,address:u.address,city:u.city,state:u.state,postalCode:u.postal_code,country:u.country,isActive:Boolean(u.is_active)});
