import { Injectable } from '@angular/core';
import { createClient } from '@supabase/supabase-js'

@Injectable({
  providedIn: 'root',
})
export class Supabase {
  supabase = createClient('https://pabhhpafcgfqlmzyxrzt.supabase.co', 'sb_publishable_E47gw43W5OMWTara2z0BKw_9owhWnU9')
}
