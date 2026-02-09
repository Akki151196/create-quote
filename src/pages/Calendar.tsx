import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AdminLayout } from '../components/AdminLayout';

interface Quotation {
  id: string;
  quotation_number: string;
  client_name: string;
  event_date: string;
  service_date: string | null;
  event_type: string;
  event_venue: string | null;
  number_of_guests: number;
  grand_total: number;
  status: string;
  approval_status: string;
}

export function Calendar() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const [selectedEvent, setSelectedEvent] = useState<Quotation | null>(null);

  useEffect(() => {
    loadEvents();
  }, [currentDate]);

  const loadEvents = async () => {
    try {
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('approval_status', 'approved')
        .or(`service_date.gte.${startOfMonth.toISOString().split('T')[0]},and(service_date.is.null,event_date.gte.${startOfMonth.toISOString().split('T')[0]})`)
        .or(`service_date.lte.${endOfMonth.toISOString().split('T')[0]},and(service_date.is.null,event_date.lte.${endOfMonth.toISOString().split('T')[0]})`)
        .order('service_date', { ascending: true, nullsFirst: false });

      if (error) throw error;
      if (data) setQuotations(data);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysInMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const getEventsForDay = (day: number) => {
    const dateStr = new Date(currentDate.getFullYear(), currentDate.getMonth(), day)
      .toISOString()
      .split('T')[0];
    return quotations.filter((q) => {
      const displayDate = q.service_date || q.event_date;
      return displayDate === dateStr;
    });
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const days = getDaysInMonth();

  if (loading) {
    return (
      <AdminLayout title="Event Calendar" showHomeButton>
        <div className="flex items-center justify-center h-full">
          <div className="text-xl text-gray-600">Loading...</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Event Calendar" showHomeButton>
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
          <div className="bg-maroon-700 text-white px-6 py-4 flex items-center justify-between">
            <button
              onClick={previousMonth}
              className="p-2 hover:bg-maroon-600 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <h2 className="text-2xl font-bold">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              onClick={nextMonth}
              className="p-2 hover:bg-maroon-600 rounded-lg transition-colors"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-7 gap-2 mb-2">
              {dayNames.map((day) => (
                <div
                  key={day}
                  className="text-center font-semibold text-gray-600 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {days.map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="aspect-square" />;
                }

                const events = getEventsForDay(day);
                const isToday =
                  day === new Date().getDate() &&
                  currentDate.getMonth() === new Date().getMonth() &&
                  currentDate.getFullYear() === new Date().getFullYear();

                return (
                  <div
                    key={day}
                    className={`aspect-square border rounded-lg p-2 ${
                      isToday
                        ? 'border-maroon-600 bg-maroon-50'
                        : 'border-gray-200 hover:border-maroon-300'
                    } transition-colors`}
                  >
                    <div className="font-semibold text-gray-800 mb-1">{day}</div>
                    <div className="space-y-1">
                      {events.slice(0, 2).map((event) => (
                        <button
                          key={event.id}
                          onClick={() => setSelectedEvent(event)}
                          className={`w-full text-xs px-2 py-1 rounded truncate text-left hover:opacity-80 transition-opacity bg-green-100 text-green-700`}
                          title={`${event.quotation_number} - ${event.client_name}`}
                        >
                          {event.quotation_number}
                        </button>
                      ))}
                      {events.length > 2 && (
                        <div className="text-xs text-gray-500 px-2">
                          +{events.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="mt-6 bg-white rounded-xl shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Approved Orders This Month</h3>
          {quotations.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No approved orders scheduled for this month</p>
          ) : (
            <div className="space-y-3">
              {quotations.map((event) => (
                <button
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="w-full flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:border-maroon-300 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800">{event.quotation_number} - {event.client_name}</h4>
                    <p className="text-sm text-gray-600">{event.event_type} | {event.number_of_guests} guests</p>
                    {event.event_venue && (
                      <p className="text-xs text-gray-500 mt-1">{event.event_venue}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-800 mb-1">
                      {new Date(event.service_date || event.event_date).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                    <p className="text-sm font-semibold text-maroon-700">
                      ₹{event.grand_total.toLocaleString('en-IN')}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {selectedEvent && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="bg-maroon-700 text-white px-6 py-4 flex items-center justify-between rounded-t-xl">
                <h3 className="text-xl font-bold">Order Details</h3>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="text-white hover:text-maroon-200 text-2xl leading-none"
                >
                  ×
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Quotation Number</p>
                    <p className="font-semibold text-gray-800">{selectedEvent.quotation_number}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Status</p>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Approved
                    </span>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Client Information</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{selectedEvent.client_name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{selectedEvent.client_phone}</p>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Event Details</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-gray-600">Event Type</p>
                      <p className="font-medium">{selectedEvent.event_type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Event Date</p>
                      <p className="font-medium">
                        {new Date(selectedEvent.event_date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                    {selectedEvent.service_date && (
                      <div>
                        <p className="text-sm text-gray-600">Service Date</p>
                        <p className="font-medium">
                          {new Date(selectedEvent.service_date).toLocaleDateString('en-IN')}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Guests</p>
                      <p className="font-medium">{selectedEvent.number_of_guests}</p>
                    </div>
                    {selectedEvent.event_venue && (
                      <div className="col-span-2">
                        <p className="text-sm text-gray-600">Venue</p>
                        <p className="font-medium">{selectedEvent.event_venue}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-gray-800 mb-2">Financial Summary</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-gray-800">Grand Total</span>
                      <span className="text-2xl font-bold text-maroon-700">
                        ₹{selectedEvent.grand_total.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <a
                    href={`/admin/quotations/view/${selectedEvent.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-maroon-700 text-white px-4 py-2 rounded-lg hover:bg-maroon-800 transition-colors text-center"
                  >
                    View Full Quotation
                  </a>
                  <a
                    href={`/admin/expenses?order=${selectedEvent.id}`}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-center"
                  >
                    Track Expenses
                  </a>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
