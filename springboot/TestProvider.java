import org.springframework.security.authentication.dao.DaoAuthenticationProvider;

public class TestProvider {
    public static void main(String[] args) {
        System.out.println("Constructors:");
        for (java.lang.reflect.Constructor<?> c : DaoAuthenticationProvider.class.getConstructors()) {
            System.out.println(c);
        }
        System.out.println("Methods containing UserDetail:");
        for (java.lang.reflect.Method m : DaoAuthenticationProvider.class.getMethods()) {
            if (m.getName().toLowerCase().contains("userdetail"))
                System.out.println(m);
        }
    }
}
