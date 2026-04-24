/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as orderPlaced } from './order-placed.tsx'
import { template as orderShipped } from './order-shipped.tsx'
import { template as orderDelivered } from './order-delivered.tsx'
import { template as refundProcessed } from './refund-processed.tsx'
import { template as staffInvite } from './staff-invite.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'order-placed': orderPlaced,
  'order-shipped': orderShipped,
  'order-delivered': orderDelivered,
  'refund-processed': refundProcessed,
  'staff-invite': staffInvite,
}
