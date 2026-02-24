// Data structure
let data = {
    members: [],
    payments: {},
    expenses: [],
    monthlyAmount: 20
};

const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
];

// Load data from localStorage
function loadData() {
    const saved = localStorage.getItem('birthdayFundData');
    if (saved) {
        data = JSON.parse(saved);
        document.getElementById('monthlyAmount').value = data.monthlyAmount || 20;
    }
    renderAll();
}

// Save data to localStorage
function saveData() {
    const monthlyInput = document.getElementById('monthlyAmount');
    if (monthlyInput) {
        data.monthlyAmount = parseFloat(monthlyInput.value) || 20;
    }
    localStorage.setItem('birthdayFundData', JSON.stringify(data));
    renderAll();
}

// Export data as JSON file
function exportData() {
    const dataStr = JSON.stringify(data, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'birthday-fund-' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
}

// Import data from JSON file
function importData(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                data = JSON.parse(e.target.result);
                saveData();
                alert('Data imported successfully!');
            } catch (error) {
                alert('Error importing data. Please check the file format.');
            }
        };
        reader.readAsText(file);
    }
}

// Tab switching
function showTab(tabName) {
    ['overview', 'birthdays', 'expenses', 'members'].forEach(function(tab) {
        document.getElementById('content-' + tab).classList.add('hidden');
        document.getElementById('tab-' + tab).classList.remove('border-purple-600', 'text-purple-600');
        document.getElementById('tab-' + tab).classList.add('text-gray-600');
    });
    document.getElementById('content-' + tabName).classList.remove('hidden');
    document.getElementById('tab-' + tabName).classList.add('border-purple-600', 'text-purple-600');
    document.getElementById('tab-' + tabName).classList.remove('text-gray-600');
}

// Add member
function addMember() {
    const name = prompt('Enter member name:');
    if (!name) return;
    const birthday = prompt('Enter birthday (MM-DD, e.g., 03-15):');

    data.members.push({
        id: Date.now(),
        name: name.trim(),
        birthday: birthday || null
    });
    saveData();
}

// Remove member
function removeMember(id) {
    if (!confirm('Are you sure you want to remove this member?')) return;
    data.members = data.members.filter(function(m) { return m.id !== id; });
    // Remove their payments too
    Object.keys(data.payments).forEach(function(key) {
        if (key.startsWith(id + '-')) {
            delete data.payments[key];
        }
    });
    saveData();
}

// Update member birthday
function updateBirthday(id, birthday) {
    const member = data.members.find(function(m) { return m.id === id; });
    if (member) {
        member.birthday = birthday || null;
        saveData();
    }
}

// Update payment
function updatePayment(memberId, month, year) {
    const key = memberId + '-' + year + '-' + month;
    const amount = parseFloat(prompt('Enter payment amount:', data.monthlyAmount));

    if (isNaN(amount) || amount < 0) {
        if (data.payments[key]) {
            delete data.payments[key];
        }
    } else {
        data.payments[key] = {
            amount: amount,
            date: new Date().toISOString()
        };
    }
    saveData();
}

// Add expense
function addExpense() {
    const description = prompt('Expense description:');
    if (!description) return;
    const amount = parseFloat(prompt('Amount:'));
    if (isNaN(amount)) return;
    const date = prompt('Date (YYYY-MM-DD):', new Date().toISOString().split('T')[0]);

    data.expenses.push({
        id: Date.now(),
        description: description.trim(),
        amount: amount,
        date: date || new Date().toISOString().split('T')[0]
    });
    saveData();
}

// Remove expense
function removeExpense(id) {
    if (!confirm('Delete this expense?')) return;
    data.expenses = data.expenses.filter(function(e) { return e.id !== id; });
    saveData();
}

// Calculate totals
function calculateTotals() {
    const totalCollected = Object.values(data.payments).reduce(function(sum, p) {
        return sum + p.amount;
    }, 0);
    const totalSpent = data.expenses.reduce(function(sum, e) {
        return sum + e.amount;
    }, 0);
    return {
        totalCollected: totalCollected,
        totalSpent: totalSpent,
        balance: totalCollected - totalSpent
    };
}

// Render payment overview table
function renderPaymentTable() {
    const currentYear = new Date().getFullYear();
    const tbody = document.getElementById('paymentTableBody');
    const thead = document.querySelector('#paymentTable thead tr');

    // Build header with all months
    thead.innerHTML = '<th class="sticky-col p-3 text-left font-semibold border-r">Member</th>';
    months.forEach(function(month) {
        thead.innerHTML += '<th class="payment-cell p-3 text-center font-semibold border-r">' + month + ' ' + currentYear + '</th>';
    });
    thead.innerHTML += '<th class="payment-cell p-3 text-center font-semibold">Total</th>';

    // Build rows
    tbody.innerHTML = '';
    data.members.forEach(function(member) {
        let row = '<tr class="border-b hover:bg-gray-50">';
        row += '<td class="sticky-col p-3 font-semibold border-r">' + member.name + '</td>';

        let memberTotal = 0;
        months.forEach(function(month, idx) {
            const key = member.id + '-' + currentYear + '-' + idx;
            const payment = data.payments[key];
            const amount = payment ? payment.amount : 0;
            memberTotal += amount;

            const bgColor = payment ? 'bg-green-50' : 'bg-red-50';
            const textColor = payment ? 'text-green-700 font-semibold' : 'text-red-500';
            const displayText = payment ? '$' + amount.toFixed(2) : '---';
            row += '<td class="payment-cell p-2 text-center border-r ' + bgColor + '">' +
                '<button onclick="updatePayment(' + member.id + ', ' + idx + ', ' + currentYear + ')" ' +
                'class="w-full px-2 py-1 rounded hover:bg-gray-200 ' + textColor + '">' +
                displayText +
                '</button>' +
                '</td>';
        });

        row += '<td class="payment-cell p-3 text-center font-bold text-purple-600">$' + memberTotal.toFixed(2) + '</td>';
        row += '</tr>';
        tbody.innerHTML += row;
    });

    // Add totals row
    let totalsRow = '<tr class="bg-gray-100 font-bold border-t-2"><td class="sticky-col p-3 border-r">TOTALS</td>';
    months.forEach(function(month, idx) {
        let monthTotal = 0;
        data.members.forEach(function(member) {
            const key = member.id + '-' + currentYear + '-' + idx;
            const payment = data.payments[key];
            if (payment) monthTotal += payment.amount;
        });
        totalsRow += '<td class="payment-cell p-3 text-center border-r text-blue-600">$' + monthTotal.toFixed(2) + '</td>';
    });
    const grandTotal = Object.values(data.payments).reduce(function(sum, p) { return sum + p.amount; }, 0);
    totalsRow += '<td class="payment-cell p-3 text-center text-purple-600">$' + grandTotal.toFixed(2) + '</td>';
    totalsRow += '</tr>';
    tbody.innerHTML += totalsRow;
}

// Render birthday list
function renderBirthdays() {
    const container = document.getElementById('birthdayList');
    const today = new Date();

    const birthdays = data.members
        .filter(function(m) { return m.birthday; })
        .map(function(member) {
            const parts = member.birthday.split('-').map(Number);
            const month = parts[0];
            const day = parts[1];
            let next = new Date(today.getFullYear(), month - 1, day);
            if (next < today) {
                next = new Date(today.getFullYear() + 1, month - 1, day);
            }
            const daysUntil = Math.ceil((next - today) / (1000 * 60 * 60 * 24));
            return {
                id: member.id,
                name: member.name,
                birthday: member.birthday,
                next: next,
                daysUntil: daysUntil
            };
        })
        .sort(function(a, b) { return a.daysUntil - b.daysUntil; });

    container.innerHTML = birthdays.map(function(person) {
        const bgColor = person.daysUntil === 0 ? 'bg-pink-100 border-pink-400' :
            person.daysUntil <= 7 ? 'bg-yellow-50 border-yellow-300' :
                'bg-gray-50 border-gray-200';
        const dateStr = person.next.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
        const daysText = person.daysUntil === 0 ? 'TODAY! 🎉' : 'days away';
        return '<div class="border-2 ' + bgColor + ' rounded-lg p-4">' +
            '<div class="flex justify-between items-center">' +
            '<div>' +
            '<p class="font-bold text-lg">' + person.name + '</p>' +
            '<p class="text-gray-600">' + dateStr + '</p>' +
            '</div>' +
            '<div class="text-right">' +
            '<p class="text-3xl font-bold text-purple-600">' + person.daysUntil + '</p>' +
            '<p class="text-sm text-gray-600">' + daysText + '</p>' +
            '</div>' +
            '</div>' +
            '</div>';
    }).join('');

    if (birthdays.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">No birthdays added yet</p>';
    }
}

// Render expenses
function renderExpenses() {
    const container = document.getElementById('expenseList');
    const sorted = data.expenses.slice().sort(function(a, b) {
        return new Date(b.date) - new Date(a.date);
    });

    container.innerHTML = sorted.map(function(expense) {
        const dateStr = new Date(expense.date).toLocaleDateString();
        return '<div class="border rounded-lg p-4 hover:shadow-md transition-shadow">' +
            '<div class="flex justify-between items-center">' +
            '<div>' +
            '<p class="font-semibold">' + expense.description + '</p>' +
            '<p class="text-sm text-gray-600">' + dateStr + '</p>' +
            '</div>' +
            '<div class="flex items-center gap-3">' +
            '<p class="text-lg font-bold text-red-600">-$' + expense.amount.toFixed(2) + '</p>' +
            '<button onclick="removeExpense(' + expense.id + ')" class="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200">' +
            '🗑️' +
            '</button>' +
            '</div>' +
            '</div>' +
            '</div>';
    }).join('');

    if (sorted.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">No expenses recorded yet</p>';
    }
}

// Render members
function renderMembers() {
    const container = document.getElementById('memberList');
    container.innerHTML = data.members.map(function(member) {
        const birthdayVal = member.birthday || '';
        return '<div class="border rounded-lg p-4">' +
            '<div class="flex justify-between items-center mb-2">' +
            '<p class="font-semibold text-lg">' + member.name + '</p>' +
            '<button onclick="removeMember(' + member.id + ')" class="px-3 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200">' +
            'Remove' +
            '</button>' +
            '</div>' +
            '<div class="flex items-center gap-2">' +
            '<label class="text-sm text-gray-600">Birthday (MM-DD):</label>' +
            '<input type="text" ' +
            'value="' + birthdayVal + '" ' +
            'placeholder="MM-DD" ' +
            'onchange="updateBirthday(' + member.id + ', this.value)" ' +
            'class="px-3 py-1 border rounded focus:ring-2 focus:ring-purple-600">' +
            '</div>' +
            '</div>';
    }).join('');

    if (data.members.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 py-8">No members added yet</p>';
    }
}

// Render summary
function renderSummary() {
    const totals = calculateTotals();
    document.getElementById('totalBalance').textContent = '$' + totals.balance.toFixed(2);
    document.getElementById('totalCollected').textContent = '$' + totals.totalCollected.toFixed(2);
    document.getElementById('totalSpent').textContent = '$' + totals.totalSpent.toFixed(2);
    document.getElementById('memberCount').textContent = data.members.length;
}

// Render everything
function renderAll() {
    renderSummary();
    renderPaymentTable();
    renderBirthdays();
    renderExpenses();
    renderMembers();
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    const monthlyInput = document.getElementById('monthlyAmount');
    if (monthlyInput) {
        monthlyInput.addEventListener('change', saveData);
    }
    loadData();
});