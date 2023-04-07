import { Fragment } from 'react'
import { Popover, Transition } from '@headlessui/react'
import { ChevronDownIcon } from '@heroicons/react/20/solid'
import React from 'react'
import { EllipsisHorizontalIcon, HeartIcon } from '@heroicons/react/24/outline'

export default function ListMenu({onFavorite, onDelete}) {
  return (
    <Popover className="relative">
      <Popover.Button className="inline-flex items-center gap-x-1 text-sm font-semibold leading-6 text-gray-900">
        <span className='sr-only'>Menu</span>
        <EllipsisHorizontalIcon className="w-4 h-4 text-slate-400" />
      </Popover.Button>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-y-1"
        enterTo="opacity-100 translate-y-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-y-0"
        leaveTo="opacity-0 translate-y-1"
      >
        <Popover.Panel className="absolute left-1/2 z-10 mt-5 flex w-screen max-w-min -translate-x-1/2 px-4">
          <div className="rounded-md bg-dmmenu p-xs text-sm text-gray-300 gap-1">
            
              <p className="px-sm py-xs rounded-md hover:bg-listitemhoverSecondary dark:hover:bg-dmlistitemhoverSecondary" onClick={onFavorite}>      
                Favorite
              </p>

              <p className="text-red-500 px-sm py-xs rounded-md hover:bg-listitemhoverSecondary dark:hover:bg-dmlistitemhoverSecondary" onClick={onDelete}>
                Delete
              </p>
            
          </div>
        </Popover.Panel>
      </Transition>
    </Popover>
  )
}