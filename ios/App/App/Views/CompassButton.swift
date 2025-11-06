import SwiftUI

struct CompassButton: View {
    var body: some View {
        Button(action: {}) {
            ZStack {
                RoundedRectangle(cornerRadius: 6)
                    .fill(Color.white)
                    .frame(width: 30, height: 30)
                
                compassIcon
            }
        }
    }
    
    private var compassIcon: some View {
        Image(systemName: "location.north.fill")
            .font(.system(size: 16, weight: .semibold))
            .foregroundColor(.black)
    }
}

#Preview {
    CompassButton()
        .padding()
        .background(Color.gray.opacity(0.2))
}
